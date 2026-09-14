import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  PanResponder,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { launchImageLibrary } from 'react-native-image-picker';

import Svg, { Line as SvgLine } from 'react-native-svg';

import { generatePDF } from 'react-native-html-to-pdf';

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  ChevronLeft,
  Copy,
  Download,
  Highlighter,
  Image as ImageIcon,
  Lock,
  Palette,
  PenTool,
  Plus,
  Redo2,
  RotateCw,
  Square,
  Trash2,
  Type,
  Unlock,
  Undo2,
} from 'lucide-react-native';

import { colors, shadowStyles } from '../utils/theme';
import { useDocuments } from '../context/DocumentContext';
import Toast from '../components/Toast';

import type { Document, DocumentContent, DocumentPage } from '../types';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

type ElementType =
  | 'title'
  | 'subtitle'
  | 'heading'
  | 'paragraph'
  | 'shape'
  | 'image';

type CanvasElement = {
  id: string;
  type: ElementType;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  imageUri?: string;
  shapeType?: 'rectangle' | 'line';
  fillColor?: string;
  locked?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  highlightColor?: string;
  textColor?: string;
  strokeWidth?: number;
};

type ElementTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

const TOOLS: {
  key: string;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
  }>;
}[] = [
  { key: 'Text', label: 'Text', icon: Type },
  { key: 'Image', label: 'Image', icon: ImageIcon },
  { key: 'Shape', label: 'Shape', icon: Square },
  { key: 'Color', label: 'Color', icon: Palette },
  { key: 'Thickness', label: 'Thickness', icon: PenTool },
  { key: 'Highlight', label: 'Highlight', icon: Highlighter },
];

const CANVAS_BASE_WIDTH = 344;
const CANVAS_BASE_HEIGHT = 520;

/*
 * ============================================================
 * PAGES HISTORY (self-contained undo/redo)
 * ============================================================
 *
 * FIX: previously this screen relied on an external `useHistory`
 * hook whose `state` was aliased directly to `pages`. Meanwhile
 * `pagesSeed` (the hook's initial value) gets a brand-new array
 * reference on every single edit, because editing calls
 * `updateDocument`, which changes `doc`, which recomputes
 * `pagesSeed` via `useMemo(() => makePages(doc), [doc])`. If the
 * external hook re-syncs its internal state whenever its initial
 * value changes (a common pattern), the undo/redo stack gets wiped
 * on every keystroke — so Undo/Redo appear to do nothing.
 *
 * This reducer is scoped entirely to this screen, only resets when
 * the document being edited actually changes (not on every edit),
 * and is simple enough to verify correct at a glance.
 */

type PagesHistoryState = {
  past: DocumentPage[][];
  present: DocumentPage[];
  future: DocumentPage[][];
};

type PagesHistoryAction =
  | { type: 'PUSH'; pages: DocumentPage[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; pages: DocumentPage[] };

function pagesHistoryReducer(
  state: PagesHistoryState,
  action: PagesHistoryAction,
): PagesHistoryState {
  switch (action.type) {
    case 'PUSH':
      return {
        past: [...state.past, state.present],
        present: action.pages,
        future: [],
      };

    case 'UNDO': {
      if (state.past.length === 0) {
        return state;
      }

      const previous = state.past[state.past.length - 1];

      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) {
        return state;
      }

      const [next, ...rest] = state.future;

      return {
        past: [...state.past, state.present],
        present: next,
        future: rest,
      };
    }

    case 'RESET':
      return {
        past: [],
        present: action.pages,
        future: [],
      };

    default:
      return state;
  }
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const EditorScreen: React.FC<Props> = ({ route, navigation }) => {
  // FIX: route.params can be undefined (e.g. navigating to this screen
  // without params, a stale nav state, or a deep link). Destructuring
  // documentId directly off route.params in that case throws
  // "Cannot convert undefined value to object".
  const { documentId } = route.params ?? {};

  const { loading, getDocument, updateDocument } = useDocuments();

  const { width: screenWidth } = useWindowDimensions();

  // FIX: also guard on documentId being present, so we don't call
  // getDocument(undefined) and instead fall cleanly into the
  // "Document not found" branch below.
  const doc = loading || !documentId ? undefined : getDocument(documentId);

  const pagesSeed = useMemo(() => makePages(doc), [doc]);

  const [pagesHistory, dispatchPagesHistory] = useReducer(
    pagesHistoryReducer,
    undefined,
    () => ({
      past: [],
      present: pagesSeed,
      future: [],
    }),
  );

  const pages = pagesHistory.present;
  const canUndo = pagesHistory.past.length > 0;
  const canRedo = pagesHistory.future.length > 0;

  const push = useCallback((nextPages: DocumentPage[]) => {
    dispatchPagesHistory({
      type: 'PUSH',
      pages: nextPages,
    });
  }, []);

  const undo = useCallback(() => {
    dispatchPagesHistory({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatchPagesHistory({ type: 'REDO' });
  }, []);

  // FIX: reset the history only when we switch to a genuinely
  // different document (or when the async load for this document
  // first completes), not on every edit — pagesSeed's reference
  // changes on every edit because it derives from `doc`, which
  // `syncPagesToDocument` updates as you type.
  useEffect(() => {
    if (loading) return;

    dispatchPagesHistory({
      type: 'RESET',
      pages: makePages(doc),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, loading]);

  const [activeIndex, setActiveIndex] = useState(0);

  const [currentTool, setCurrentTool] = useState('Text');

  const [highlightColor, setHighlightColor] = useState<string>(
    colors.highlight,
  );

  const HIGHLIGHT_COLORS = useMemo(
    () => [
      colors.highlight,
      '#dcfce7',
      '#dbeafe',
      '#fce7f3',
      '#fef9c3',
      '#fbcfe8',
    ],
    [],
  );

  const TEXT_COLORS = useMemo(
    () => [
      { label: 'Black', value: '#0f172a' },
      { label: 'Gray', value: '#64748b' },
      { label: 'Red', value: '#ef4444' },
      { label: 'Blue', value: '#3b82f6' },
      { label: 'Green', value: '#22c55e' },
      { label: 'Purple', value: '#8b5cf6' },
      { label: 'Orange', value: '#f97316' },
      { label: 'Pink', value: '#ec4899' },
    ],
    [],
  );

  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );

  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  const [toast, setToast] = useState('');

  const [renameMode, setRenameMode] = useState(false);

  const [renameValue, setRenameValue] = useState('');

  const [elements, setElements] = useState<CanvasElement[]>([]);

  const lastContentHash = useRef('');

  const activePage = pages[activeIndex] ?? pages[0];

  const content = activePage?.content;

  /*
   * ---------------------------------------------------------
   * INITIALISE CANVAS ELEMENTS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!content) {
      setElements([]);
      return;
    }

    const contentHash = JSON.stringify(content);

    if (contentHash === lastContentHash.current && elements.length > 0) {
      return;
    }

    lastContentHash.current = contentHash;

    setElements(createCanvasElements(content));

    setSelectedElementId(null);
    setEditingElementId(null);
  }, [activeIndex, content, elements.length]);

  /*
   * ---------------------------------------------------------
   * DOCUMENT SYNC
   * ---------------------------------------------------------
   */

  const syncPagesToDocument = useCallback(
    (nextPages: DocumentPage[], index = activeIndex) => {
      if (!doc) return;

      const page = nextPages[index] ?? nextPages[0];

      if (!page) return;

      updateDocument({
        ...doc,
        title: page.content.title || doc.title,

        content: page.content,

        pageCount: nextPages.length,
      });
    },
    [activeIndex, doc, updateDocument],
  );

  /*
   * ---------------------------------------------------------
   * UPDATE CONTENT
   * ---------------------------------------------------------
   */

  const updateContent = useCallback(
    (updater: (current: DocumentContent) => DocumentContent) => {
      const currentPage = pages[activeIndex];

      if (!currentPage) return;

      const nextContent = updater(currentPage.content);

      const nextPages = [...pages];

      nextPages[activeIndex] = {
        ...currentPage,
        content: nextContent,
      };

      push(nextPages);

      syncPagesToDocument(nextPages, activeIndex);

      return nextContent;
    },
    [activeIndex, pages, push, syncPagesToDocument],
  );

  /*
   * ---------------------------------------------------------
   * TEXT EDITING
   * ---------------------------------------------------------
   */

  const updateElementText = useCallback((elementId: string, value: string) => {
    setElements(current =>
      current.map(element =>
        element.id === elementId
          ? {
              ...element,
              text: value,
            }
          : element,
      ),
    );
  }, []);

  const commitElementText = useCallback(
    (element: CanvasElement) => {
      updateContent(current => {
        if (element.type === 'title') {
          return {
            ...current,
            title: element.text,
          };
        }

        if (element.type === 'subtitle') {
          return {
            ...current,
            subtitle: element.text,
          };
        }

        if (element.type === 'heading') {
          // FIX: pass current.sections so the lookup can actually
          // resolve which section this heading belongs to.
          const sectionIndex = getSectionIndexFromId(
            element.id,
            current.sections,
          );

          if (sectionIndex < 0 || sectionIndex >= current.sections.length) {
            return current;
          }

          const sections = [...current.sections];

          sections[sectionIndex] = {
            ...sections[sectionIndex],
            heading: element.text,
          };

          return {
            ...current,
            sections,
          };
        }

        if (element.type === 'paragraph') {
          // FIX: pass current.sections so the lookup can actually
          // resolve which section/paragraph this element belongs to.
          const { sectionIndex, paragraphIndex } = getParagraphIndexesFromId(
            element.id,
            current.sections,
          );

          if (
            sectionIndex < 0 ||
            paragraphIndex < 0 ||
            sectionIndex >= current.sections.length
          ) {
            return current;
          }

          const sections = [...current.sections];

          const section = sections[sectionIndex];

          const paragraphs = [...section.paragraphs];

          paragraphs[paragraphIndex] = element.text;

          sections[sectionIndex] = {
            ...section,
            paragraphs,
          };

          return {
            ...current,
            sections,
          };
        }

        return current;
      });
    },
    [updateContent],
  );

  const finishEditing = useCallback(
    (elementId: string) => {
      const element = elements.find(item => item.id === elementId);

      if (element) {
        commitElementText(element);
      }

      setEditingElementId(null);
    },
    [elements, commitElementText],
  );

  /*
   * ---------------------------------------------------------
   * ELEMENT TRANSFORM
   * ---------------------------------------------------------
   */

  const updateElementTransform = useCallback(
    (id: string, transform: ElementTransform) => {
      setElements(current =>
        current.map(element =>
          element.id === id
            ? {
                ...element,
                ...transform,
              }
            : element,
        ),
      );
    },
    [],
  );

  /*
   * ---------------------------------------------------------
   * ADD TEXT
   * ---------------------------------------------------------
   */

  const addTextElement = useCallback(() => {
    const id = `section-${Date.now()}`;

    const newSection = {
      id,
      heading: 'New text',
      paragraphs: ['Tap to edit'],
    };

    const nextContent = updateContent(current => ({
      ...current,
      sections: [...(current.sections ?? []), newSection],
    }));

    if (!nextContent) return;

    const newElements = createCanvasElements(nextContent).map(el =>
      `heading-${id}` === el.id ? { ...el, highlightColor } : el,
    );

    setElements(newElements);

    const newHeading = newElements.find(
      element => element.id === `heading-${id}`,
    );

    if (newHeading) {
      setSelectedElementId(newHeading.id);

      setEditingElementId(newHeading.id);
    }

    setToast('Text added');
  }, [highlightColor, updateContent]);

  /*
   * ---------------------------------------------------------
   * ADD SHAPE
   * ---------------------------------------------------------
   */

  const addShapeElement = useCallback(() => {
    const shapeId = `shape-${Date.now()}`;

    setElements(prev => [
      ...prev,
      {
        id: shapeId,
        type: 'shape',
        text: '',
        x: 80,
        y: 80,
        width: 160,
        height: 4,
        scale: 1,
        rotation: 0,
        shapeType: 'line',
        strokeWidth: 2,
        fillColor: colors.primary,
      },
    ]);

    setSelectedElementId(shapeId);
    setToast('Line added');
  }, []);

  /*
   * ---------------------------------------------------------
   * ADD IMAGE
   * ---------------------------------------------------------
   */

  const pickAndAddImage = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
      });

      if (result.didCancel) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      if (!asset.uri) {
        setToast('Could not read image');
        return;
      }

      const imageId = `image-${Date.now()}`;

      setElements(prev => [
        ...prev,
        {
          id: imageId,
          type: 'image',
          text: '',
          x: 80,
          y: 80,
          width: 120,
          height: 120,
          scale: 1,
          rotation: 0,
          imageUri: asset.uri,
        },
      ]);

      setSelectedElementId(imageId);
      setToast('Image added');
    } catch (error) {
      console.warn('Image picker error:', error);
      setToast('Failed to pick image');
    }
  }, []);

  /*
   * ---------------------------------------------------------
   * TOOL HANDLING
   * ---------------------------------------------------------
   */

  const handleTool = useCallback(
    (key: string) => {
      setCurrentTool(key);

      if (key === 'Text') {
        addTextElement();
        return;
      }

      if (key === 'Highlight') {
        const selected = elements.find(
          element => element.id === selectedElementId,
        );

        if (
          !selected ||
          selected.type === 'shape' ||
          selected.type === 'image'
        ) {
          setToast('Select text first');
          return;
        }

        Alert.alert(
          'Highlight Color',
          'Choose a highlight color',
          [
            ...HIGHLIGHT_COLORS.map(color => ({
              text: color,
              onPress: () => {
                setElements(prev =>
                  prev.map(el =>
                    el.id === selected.id
                      ? { ...el, highlightColor: color }
                      : el,
                  ),
                );

                setHighlightColor(color);
                setToast('Highlighted');
              },
            })),
            { text: 'Cancel', style: 'cancel' },
          ],
        );

        return;
      }

      if (key === 'Shape') {
        addShapeElement();
        return;
      }

      if (key === 'Image') {
        pickAndAddImage();
        return;
      }

      if (key === 'Color') {
        const selected = elements.find(
          element => element.id === selectedElementId,
        );

        if (!selected || selected.type === 'shape' || selected.type === 'image') {
          setToast('Select a text element');
          return;
        }

        Alert.alert(
          'Text Color',
          'Choose a text color',
          [
            ...TEXT_COLORS.map(color => ({
              text: color.label,
              onPress: () => {
                setElements(prev =>
                  prev.map(el =>
                    el.id === selectedElementId
                      ? { ...el, textColor: color.value }
                      : el,
                  ),
                );
                setToast('Text color applied');
              },
            })),
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        return;
      }

      if (key === 'Thickness') {
        const selected = elements.find(
          element => element.id === selectedElementId,
        );

        if (!selected || selected.type !== 'shape') {
          setToast('Select a shape element');
          return;
        }

        const thicknessOptions = [1, 2, 3, 4, 5, 8, 12];

        Alert.alert(
          'Line Thickness',
          'Choose a thickness',
          [
            ...thicknessOptions.map(t => ({
              text: `${t}px`,
              onPress: () => {
                setElements(prev =>
                  prev.map(el =>
                    el.id === selectedElementId
                      ? { ...el, strokeWidth: t }
                      : el,
                  ),
                );
                setToast(`Thickness set to ${t}px`);
              },
            })),
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        return;
      }
    },
    [
      addTextElement,
      addShapeElement,
      pickAndAddImage,
      elements,
      selectedElementId,
      HIGHLIGHT_COLORS,
      TEXT_COLORS,
    ],
  );

  /*
   * ---------------------------------------------------------
   * ELEMENT ACTIONS
   * ---------------------------------------------------------
   */

  const duplicateElement = useCallback(() => {
    const selected = elements.find(el => el.id === selectedElementId);

    if (!selected) {
      setToast('Select an element to duplicate');
      return;
    }

    const newElement: CanvasElement = {
      ...selected,
      id: `el-${Date.now()}`,
      x: selected.x + 20,
      y: selected.y + 20,
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    setToast('Element duplicated');
  }, [elements, selectedElementId]);

  const deleteElement = useCallback(() => {
    const selected = elements.find(el => el.id === selectedElementId);

    if (!selected) {
      setToast('Select an element to delete');
      return;
    }

    setElements(prev => prev.filter(el => el.id !== selectedElementId));
    setSelectedElementId(null);
    setToast('Element deleted');
  }, [elements, selectedElementId]);

  const toggleLock = useCallback(() => {
    const selected = elements.find(el => el.id === selectedElementId);

    if (!selected) {
      setToast('Select an element to lock');
      return;
    }

    setElements(prev =>
      prev.map(el =>
        el.id === selectedElementId
          ? { ...el, locked: !el.locked }
          : el,
      ),
    );

    setToast(selected.locked ? 'Element unlocked' : 'Element locked');
  }, [elements, selectedElementId]);

  const setElementAlignment = useCallback(
    (align: 'left' | 'center' | 'right') => {
      const selected = elements.find(el => el.id === selectedElementId);

      if (!selected || selected.type === 'shape' || selected.type === 'image') {
        setToast('Select a text element');
        return;
      }

      setElements(prev =>
        prev.map(el =>
          el.id === selectedElementId ? { ...el, textAlign: align } : el,
        ),
      );

      setToast(`Alignment set to ${align}`);
    },
    [elements, selectedElementId],
  );

  /*
   * ---------------------------------------------------------
   * PAGE ACTIONS
   * ---------------------------------------------------------
   */

  const addPage = useCallback(() => {
    const baseContent: DocumentContent = {
      title: doc?.content.title ?? doc?.title ?? 'Untitled document',

      subtitle: doc?.content.subtitle ?? '',

      sections: [],
    };

    const newPage: DocumentPage = {
      id: `page-${Date.now()}`,

      content: baseContent,

      rotation: 0,
    };

    const nextPages = [...pages, newPage];

    push(nextPages);

    const newIndex = nextPages.length - 1;

    setActiveIndex(newIndex);

    syncPagesToDocument(nextPages, newIndex);

    setToast('Page added');
  }, [doc, pages, push, syncPagesToDocument]);

  const rotatePage = useCallback(() => {
    const page = pages[activeIndex];

    if (!page) return;

    const nextRotation = page.rotation === 270 ? 0 : (page.rotation ?? 0) + 90;

    const nextPages = [...pages];

    nextPages[activeIndex] = {
      ...page,
      rotation: nextRotation,
    };

    push(nextPages);

    syncPagesToDocument(nextPages, activeIndex);

    setToast('Rotated 90°');
  }, [activeIndex, pages, push, syncPagesToDocument]);

  /*
   * ---------------------------------------------------------
   * UNDO / REDO
   * ---------------------------------------------------------
   */

  const handleUndo = useCallback(() => {
    if (!canUndo) return;

    undo();

    setToast('Undo');
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;

    redo();

    setToast('Redo');
  }, [canRedo, redo]);

  /*
   * ---------------------------------------------------------
   * RENAME
   * ---------------------------------------------------------
   */

  const startRename = useCallback(() => {
    if (!doc) return;

    setRenameValue(doc.fileName || doc.title || '');

    setRenameMode(true);
  }, [doc]);

  const saveRename = useCallback(() => {
    if (!doc) return;

    const value = renameValue.trim();

    if (!value) {
      setRenameMode(false);
      return;
    }

    const nextPages = [...pages];

    if (nextPages[activeIndex]) {
      nextPages[activeIndex] = {
        ...nextPages[activeIndex],
        content: {
          ...nextPages[activeIndex].content,
          title: value,
        },
      };
    }

    updateDocument({
      ...doc,
      title: value,
      fileName: value,
    });

    push(nextPages);

    setRenameMode(false);

    setToast('Name updated');
  }, [activeIndex, doc, pages, push, renameValue, updateDocument]);

  /*
   * ---------------------------------------------------------
   * SHARE
   * ---------------------------------------------------------
   */

  const generateDocumentHTML = useCallback((docContent: DocumentContent) => {
    const { title, subtitle, sections } = docContent;

    const sectionHTML = (sections ?? []).map(section => {
      const paragraphs = section.paragraphs
        .map(p => `<p style="margin:4px 0;line-height:1.4">${escapeHTML(p)}</p>`)
        .join('');

      return `
        <div style="margin-bottom:20px">
          <h2 style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:#0f172a">${escapeHTML(section.heading)}</h2>
          ${paragraphs}
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; margin:40px; color: #333; }
        </style>
      </head>
      <body>
        <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:700;color:#0f172a">${escapeHTML(title)}</h1>
        ${subtitle ? `<p style="margin:0 0 16px 0;font-size:14px;color:#64748b">${escapeHTML(subtitle)}</p>` : ''}
        ${sectionHTML}
      </body>
      </html>
    `;
  }, []);

  const handleDownload = useCallback(async () => {
     if (!doc) return;

    const html = generateDocumentHTML(doc.content);

    const timestamp = Date.now();

    try {
      const { filePath } = await generatePDF({
        html,
        fileName: `doc_${timestamp}`,
        directory: 'document',
        width: 612,
        height: 792,
      });

      if (filePath) {
        await Share.share({
          url: Platform.OS === 'ios' ? `file://${filePath}` : filePath,
          title: doc.fileName,
        });
        setToast('Document saved');
      }
    } catch {
      setToast('Download failed');
    }
  }, [doc, generateDocumentHTML]);

  /*
   * ---------------------------------------------------------
   * ROTATION
   * ---------------------------------------------------------
   */

  const pageRotation = pages[activeIndex]?.rotation ?? 0;

  /*
   * ---------------------------------------------------------
   * RESPONSIVE CANVAS
   * ---------------------------------------------------------
   */

  const canvasWidth = Math.min(
    CANVAS_BASE_WIDTH,
    Math.max(280, screenWidth - 32),
  );

  const canvasScale = canvasWidth / CANVAS_BASE_WIDTH;

  const canvasHeight = CANVAS_BASE_HEIGHT * canvasScale;

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <View style={[styles.screen, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!doc || !activePage) {
    return (
      <View style={[styles.screen, styles.loadingContainer]}>
        <Text style={styles.notFoundText}>Document not found</Text>
      </View>
    );
  }

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  const selectedElement = elements.find(
    el => el.id === selectedElementId,
  );

  return (
    <View style={styles.screen}>
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          {renameMode ? (
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              onSubmitEditing={saveRename}
              onBlur={saveRename}
              autoFocus
              returnKeyType="done"
              style={styles.renameInput}
              selectTextOnFocus
            />
          ) : (
            <TouchableOpacity onPress={startRename} activeOpacity={0.7}>
              <Text style={styles.headerName} numberOfLines={1}>
                {doc.fileName}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.savedRow}>
            <Check size={12} color={colors.primary} />

            <Text style={styles.savedText}>Saved</Text>
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Undo"
          style={styles.headerBtn}
          onPress={handleUndo}
          disabled={!canUndo}
          activeOpacity={0.7}
        >
          <Undo2
            size={18}
            color={canUndo ? colors.foreground : colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Redo"
          style={styles.headerBtn}
          onPress={handleRedo}
          disabled={!canRedo}
          activeOpacity={0.7}
        >
          <Redo2
            size={18}
            color={canRedo ? colors.foreground : colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Download"
          style={styles.headerBtn}
          onPress={handleDownload}
          activeOpacity={0.7}
        >
          <Download size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* PAGE STRIP */}

      <View style={styles.pageStripWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pageStrip}
        >
          {pages.map((page: DocumentPage, index: number) => {
            const isActive = index === activeIndex;

            return (
              <TouchableOpacity
                key={page.id}
                accessibilityRole="button"
                accessibilityLabel={`Page ${index + 1}`}
                style={[styles.pageThumb, isActive && styles.pageThumbActive]}
                onPress={() => {
                  setActiveIndex(index);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.thumbInner}>
                  <View style={styles.thumbTop} />

                  <View style={[styles.thumbLine, styles.thumbLineShort]} />

                  <View style={[styles.thumbLine, styles.thumbLineShort2]} />
                </View>

                <View
                  style={[styles.pageNum, isActive && styles.pageNumActive]}
                >
                  <Text style={styles.pageNumText}>{index + 1}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Add page"
            style={styles.addPageBtn}
            onPress={addPage}
            activeOpacity={0.7}
          >
            <Plus size={18} color={colors.primary} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* CANVAS */}

      <View style={styles.canvasWrapper}>
        <View
          style={[
            styles.canvasFrame,
            {
              width: canvasWidth,
              height: canvasHeight,
            },
          ]}
        >
          <View
            style={[
              styles.canvas,
              {
                width: CANVAS_BASE_WIDTH,
                height: CANVAS_BASE_HEIGHT,
                transform: [
                  {
                    scale: canvasScale,
                  },
                  {
                    rotate: `${pageRotation}deg`,
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.canvasTouchArea}
              onPress={() => {
                if (editingElementId) {
                  finishEditing(editingElementId);
                }

                setSelectedElementId(null);
              }}
            >
              {/* CANVAS ELEMENTS */}

              {elements.map(element => (
                <CanvasElementView
                  key={element.id}
                  element={element}
                  selected={selectedElementId === element.id}
                  editing={editingElementId === element.id}
                  onSelect={() => {
                    setSelectedElementId(element.id);
                  }}
                  onEdit={() => {
                    setSelectedElementId(element.id);

                    setEditingElementId(element.id);
                  }}
                  onChangeTransform={transform => {
                    updateElementTransform(element.id, transform);
                  }}
                  onFinishTransform={() => {
                    setToast('Position updated');
                  }}
                  onTextChange={value => {
                    updateElementText(element.id, value);
                  }}
                  onFinishEditing={() => {
                    finishEditing(element.id);
                  }}
                />
              ))}

              {/* CHART */}

              {content?.goalBars && content.goalBars.length > 0 ? (
                <View pointerEvents="none" style={styles.chartOverlay}>
                  <View style={styles.chartAxis} />

                  <View style={styles.chart}>
                    {content.goalBars.map((value: number, index: number) => {
                      const max = Math.max(...content.goalBars!, 1);

                      return (
                        <View key={index} style={styles.chartCol}>
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: (value / max) * 70,
                              },
                            ]}
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* TOOLBAR */}

      <View style={styles.toolsArea}>
        {/* TOOLS */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolsGrid}
        >
          {TOOLS.map(tool => {
            const isActive = currentTool === tool.key;

            return (
              <TouchableOpacity
                key={tool.key}
                accessibilityRole="button"
                accessibilityLabel={tool.label}
                accessibilityState={{
                  selected: isActive,
                }}
                style={[styles.toolBtn, isActive && styles.toolBtnActive]}
                onPress={() => handleTool(tool.key)}
                activeOpacity={0.7}
              >
                <tool.icon
                  size={20}
                  color={isActive ? colors.primary : colors.mutedForeground}
                />

                <Text style={styles.toolLabel}>{tool.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* PAGE / ELEMENT ACTIONS */}

        {selectedElementId ? (
          <View style={styles.pageActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                selectedElement?.locked ? 'Unlock' : 'Lock'
              }
              style={styles.pageAction}
              onPress={toggleLock}
              activeOpacity={0.7}
            >
              {selectedElement?.locked ? (
                <Unlock size={14} color={colors.mutedForeground} />
              ) : (
                <Lock size={14} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            <View style={styles.pageActionsDivider} />

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Delete"
              style={styles.pageAction}
              onPress={deleteElement}
              activeOpacity={0.7}
            >
              <Trash2 size={14} color={colors.destructive} />
            </TouchableOpacity>

            {selectedElement?.type === 'shape' ? (
              <>
                <View style={styles.pageActionsDivider} />

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Thickness"
                  style={styles.pageAction}
                  onPress={() => handleTool('Thickness')}
                  activeOpacity={0.7}
                >
                  <PenTool size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </>
            ) : null}

            {selectedElement &&
            selectedElement.type !== 'shape' &&
            selectedElement.type !== 'image' ? (
              <>
                <View style={styles.pageActionsDivider} />

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Text color"
                  style={styles.pageAction}
                  onPress={() => handleTool('Color')}
                  activeOpacity={0.7}
                >
                  <Palette size={14} color={colors.mutedForeground} />
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Align left"
                  style={styles.pageAction}
                  onPress={() =>
                    setElementAlignment('left')
                  }
                  activeOpacity={0.7}
                >
                  <AlignLeft
                    size={14}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Align center"
                  style={styles.pageAction}
                  onPress={() =>
                    setElementAlignment('center')
                  }
                  activeOpacity={0.7}
                >
                  <AlignCenter
                    size={14}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Align right"
                  style={styles.pageAction}
                  onPress={() =>
                    setElementAlignment('right')
                  }
                  activeOpacity={0.7}
                >
                  <AlignRight
                    size={14}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        ) : (
          <View style={styles.pageActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Duplicate"
              style={styles.pageAction}
              onPress={duplicateElement}
              activeOpacity={0.7}
            >
              <Copy size={14} color={colors.mutedForeground} />

              <Text style={styles.pageActionText}>Duplicate</Text>
            </TouchableOpacity>

            <View style={styles.pageActionsDivider} />

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Rotate"
              style={styles.pageAction}
              onPress={rotatePage}
              activeOpacity={0.7}
            >
              <RotateCw size={14} color={colors.mutedForeground} />

              <Text style={styles.pageActionText}>Rotate</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Toast message={toast} visible={!!toast} onDismiss={() => setToast('')} />
    </View>
  );
};

/*
 * ============================================================
 * CANVAS ELEMENT
 * ============================================================
 */

type CanvasElementViewProps = {
  element: CanvasElement;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onChangeTransform: (transform: ElementTransform) => void;
  onFinishTransform: () => void;
  onTextChange: (value: string) => void;
  onFinishEditing: () => void;
};

const CanvasElementView: React.FC<CanvasElementViewProps> = ({
  element,
  selected,
  editing,
  onSelect,
  onEdit,
  onChangeTransform,
  onFinishTransform,
  onTextChange,
  onFinishEditing,
}) => {
  const gestureStart = useRef<ElementTransform>({
    x: element.x,
    y: element.y,
    scale: element.scale,
    rotation: element.rotation,
  });

  const lastDistance = useRef<number | null>(null);

  const lastAngle = useRef<number | null>(null);

  // FIX: PanResponder.create({...}) below is only ever evaluated
  // once, inside useRef's initializer. Its handlers therefore closed
  // over `element`, `onSelect`, `onChangeTransform` and
  // `onFinishTransform` as they were on the FIRST render only. Every
  // gesture after the first one used those stale, mount-time values
  // — e.g. `gestureStart.current.scale` was always reset to the
  // original scale, not the element's current scale — so pinch-to-
  // resize (and drag) worked once and then appeared broken. These
  // refs are updated on every render so the handlers always read the
  // latest props/element without needing to recreate the responder.
  const latest = useRef({
    element,
    onSelect,
    onChangeTransform,
    onFinishTransform,
  });

  useEffect(() => {
    latest.current = {
      element,
      onSelect,
      onChangeTransform,
      onFinishTransform,
    };
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: event => {
        latest.current.onSelect();

        const currentElement = latest.current.element;

        gestureStart.current = {
          x: currentElement.x,
          y: currentElement.y,
          scale: currentElement.scale,
          rotation: currentElement.rotation,
        };

        const touches = event.nativeEvent.touches;

        if (touches.length >= 2) {
          lastDistance.current = getTouchDistance(touches);

          lastAngle.current = getTouchAngle(touches);
        } else {
          lastDistance.current = null;

          lastAngle.current = null;
        }
      },

      onPanResponderMove: (event, gestureState) => {
        const currentElement = latest.current.element;

        if (currentElement.locked) {
          return;
        }

        const touches = event.nativeEvent.touches;

        /*
         * ONE FINGER
         * Move element.
         */

        if (touches.length < 2) {
          latest.current.onChangeTransform({
            x: gestureStart.current.x + gestureState.dx,

            y: gestureStart.current.y + gestureState.dy,

            scale: gestureStart.current.scale,

            rotation: gestureStart.current.rotation,
          });

          return;
        }

        /*
         * TWO FINGERS
         * Pinch + rotate.
         */

        const distance = getTouchDistance(touches);

        const angle = getTouchAngle(touches);

        if (lastDistance.current === null || lastAngle.current === null) {
          lastDistance.current = distance;

          lastAngle.current = angle;

          return;
        }

        const scaleRatio = distance / lastDistance.current;

        const nextScale = clamp(
          gestureStart.current.scale * scaleRatio,
          0.5,
          2.5,
        );

        const angleDelta = angle - lastAngle.current;

        const nextRotation = gestureStart.current.rotation + angleDelta;

        latest.current.onChangeTransform({
          x: gestureStart.current.x + gestureState.dx,

          y: gestureStart.current.y + gestureState.dy,

          scale: nextScale,

          rotation: nextRotation,
        });
      },

      onPanResponderRelease: () => {
        lastDistance.current = null;

        lastAngle.current = null;

        latest.current.onFinishTransform();
      },

      onPanResponderTerminate: () => {
        lastDistance.current = null;

        lastAngle.current = null;
      },
    }),
  ).current;

  const handlePress = useCallback(() => {
    onSelect();

    if (selected && !element.locked) {
      onEdit();
    }
  }, [element.locked, onEdit, onSelect, selected]);

  const textStyle = getElementTextStyle(element.type);

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.element,
        {
          left: element.x,
          top: element.y,
          width: element.width,
          minHeight: element.height,

          transform: [
            {
              scale: element.scale,
            },
            {
              rotate: `${element.rotation}deg`,
            },
          ],
        },

        element.locked && styles.elementLocked,
        selected && styles.elementSelected,
      ]}
    >
      {element.type === 'shape' ? (
        element.shapeType === 'line' ? (
          <View style={styles.shapeBox}>
            <Svg width={element.width} height={element.height}>
              <SvgLine
                x1="0"
                y1={element.height / 2}
                x2={element.width}
                y2={element.height / 2}
                stroke={element.fillColor || colors.primary}
                strokeWidth={element.strokeWidth ?? 2}
                strokeLinecap="round"
              />
            </Svg>
          </View>
        ) : (
          <View
            style={[
              styles.shapeBox,
              {
                backgroundColor: element.fillColor || colors.primary,
              },
            ]}
          />
        )
      ) : element.type === 'image' ? (
        <RNImage
          source={{ uri: element.imageUri }}
          style={styles.imageBox}
          resizeMode="cover"
        />
      ) : editing ? (
        <TextInput
          value={element.text}
          onChangeText={onTextChange}
          onBlur={onFinishEditing}
          autoFocus
          multiline={element.type === 'paragraph'}
            style={[textStyle, styles.inlineEditor, { color: element.textColor, textAlign: element.textAlign ?? 'left' }]}
          textAlignVertical="top"
          placeholder={element.type === 'title' ? 'Title' : 'Type here...'}
        />
      ) : (
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePress}
          style={styles.elementInner}
        >
           <Text
            style={[
              textStyle,
              element.highlightColor
                ? [styles.elementHighlight, { backgroundColor: element.highlightColor }]
                : undefined,
              { color: element.textColor, textAlign: element.textAlign ?? 'left' },
            ]}
          >
            {element.text || getPlaceholder(element.type)}
          </Text>
        </TouchableOpacity>
      )}

      {selected && !editing ? (
        <>
          <View
            pointerEvents="none"
            style={[styles.selectionHandle, styles.handleTopLeft]}
          />

          <View
            pointerEvents="none"
            style={[styles.selectionHandle, styles.handleTopRight]}
          />

          <View
            pointerEvents="none"
            style={[styles.selectionHandle, styles.handleBottomLeft]}
          />

          <View
            pointerEvents="none"
            style={[styles.selectionHandle, styles.handleBottomRight]}
          />
        </>
      ) : null}
    </View>
  );
};

/*
 * ============================================================
 * CREATE CANVAS ELEMENTS
 * ============================================================
 */

function createCanvasElements(content: DocumentContent): CanvasElement[] {
  const elements: CanvasElement[] = [];

  /*
   * TITLE
   */

  if (content.title) {
    elements.push({
      id: 'title',
      type: 'title',
      text: content.title,
      x: 24,
      y: 24,
      width: 296,
      height: 44,
      scale: 1,
      rotation: 0,
    });
  }

  /*
   * SUBTITLE
   */

  if (content.subtitle) {
    elements.push({
      id: 'subtitle',
      type: 'subtitle',
      text: content.subtitle,
      x: 24,
      y: content.title ? 72 : 28,
      width: 296,
      height: 32,
      scale: 1,
      rotation: 0,
    });
  }

  /*
   * SECTIONS
   */

  let currentY = content.title
    ? content.subtitle
      ? 116
      : 82
    : content.subtitle
    ? 60
    : 28;

  (content.sections ?? []).forEach(section => {
    if (section.heading) {
      elements.push({
        id: `heading-${section.id}`,
        type: 'heading',
        text: section.heading,
        x: 24,
        y: currentY,
        width: 296,
        height: 32,
        scale: 1,
        rotation: 0,
      });

      currentY += 38;
    }

    section.paragraphs.forEach((paragraph, paragraphIndex) => {
      if (paragraph) {
        elements.push({
          id: `paragraph-${section.id}-${paragraphIndex}`,
          type: 'paragraph',
          text: paragraph,
          x: 24,
          y: currentY,
          width: 296,
          height: 46,
          scale: 1,
          rotation: 0,
        });

        currentY += 54;
      }
    });

    currentY += 12;
  });

  return elements;
}

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

// FIX: previously this always returned -1 even after a successful
// match (dead code), and the regex (/sec-(\d+)/) could never match
// real section ids anyway, since sections are created with ids like
// `section-${Date.now()}`, not `sec-<n>`. Now it resolves the index
// by matching the actual section id against the provided list.
function getSectionIndexFromId(
  id: string,
  sections: DocumentContent['sections'],
): number {
  const sectionId = id.replace('heading-', '');

  return sections.findIndex(section => section.id === sectionId);
}

// FIX: same dead-code / wrong-regex issue as above. Paragraph element
// ids look like `paragraph-${section.id}-${paragraphIndex}`. We strip
// the prefix, split on '-', take the last segment as the paragraph
// index, and rejoin the rest as the section id to look up.
function getParagraphIndexesFromId(
  id: string,
  sections: DocumentContent['sections'],
): {
  sectionIndex: number;
  paragraphIndex: number;
} {
  const value = id.replace('paragraph-', '');

  const parts = value.split('-');

  const paragraphIndex = Number(parts[parts.length - 1]);

  const sectionId = parts.slice(0, parts.length - 1).join('-');

  const sectionIndex = sections.findIndex(section => section.id === sectionId);

  return {
    sectionIndex,
    paragraphIndex,
  };
}

function getPlaceholder(type: ElementType): string {
  switch (type) {
    case 'title':
      return 'Untitled document';

    case 'subtitle':
      return 'Add a subtitle';

    case 'heading':
      return 'Heading';

    case 'paragraph':
      return 'Tap to add text';

    default:
      return '';
  }
}

function getElementTextStyle(type: ElementType) {
  switch (type) {
    case 'title':
      return styles.elementTitle;

    case 'subtitle':
      return styles.elementSubtitle;

    case 'heading':
      return styles.elementHeading;

    case 'paragraph':
      return styles.elementParagraph;

    default:
      return styles.elementParagraph;
  }
}

function getTouchDistance(touches: readonly any[]): number {
  if (touches.length < 2) {
    return 0;
  }

  const first = touches[0];
  const second = touches[1];

  const dx = second.pageX - first.pageX;

  const dy = second.pageY - first.pageY;

  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchAngle(touches: readonly any[]): number {
  if (touches.length < 2) {
    return 0;
  }

  const first = touches[0];
  const second = touches[1];

  return (
    Math.atan2(second.pageY - first.pageY, second.pageX - first.pageX) *
    (180 / Math.PI)
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/*
 * ============================================================
 * DOCUMENT -> PAGES
 * ============================================================
 */

function makePages(doc: Document | undefined): DocumentPage[] {
  if (!doc) {
    return [
      {
        id: 'page-0',
        content: {
          title: 'Untitled',
          sections: [],
        },
        rotation: 0,
      },
    ];
  }

  const count = Math.max(doc.pageCount, 1);

  const pages: DocumentPage[] = [];

  for (let index = 0; index < count; index++) {
    pages.push({
      id: `page-${index}`,

      content:
        index === 0
          ? doc.content
          : {
              title: doc.title,

              subtitle: doc.content.subtitle,

              sections: [],
            },

      rotation: 0,
    });
  }

  return pages;
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  notFoundText: {
    color: colors.mutedForeground,
    marginTop: 12,
  },

  /*
   * HEADER
   */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 8,
    height: 56,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    minWidth: 0,
  },

  headerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },

  renameInput: {
    height: 32,
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },

  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },

  savedText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },

  /*
   * PAGE STRIP
   */

  pageStripWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  pageStrip: {
    gap: 16,
    alignItems: 'center',
    paddingRight: 12,
  },

  pageThumb: {
    width: 48,
    height: 64,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  pageThumbActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },

  thumbInner: {
    alignItems: 'center',
    gap: 3,
  },

  thumbTop: {
    width: 32,
    height: 3,
    backgroundColor: `${colors.primary}60`,
    borderRadius: 2,
  },

  thumbLine: {
    width: 28,
    height: 2,
    backgroundColor: colors.muted,
    borderRadius: 2,
  },

  thumbLineShort: {
    width: 18,
    marginTop: 2,
  },

  thumbLineShort2: {
    width: 14,
    marginTop: 2,
  },

  pageNum: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },

  pageNumActive: {
    backgroundColor: colors.primary,
  },

  pageNumText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.primaryForeground,
  },

  addPageBtn: {
    width: 36,
    height: 64,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  /*
   * CANVAS
   */

  canvasWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },

  canvasFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },

  canvas: {
    backgroundColor: colors.background,
    borderRadius: 6,
    ...shadowStyles.floating,
    overflow: 'visible',
  },

  canvasTouchArea: {
    width: CANVAS_BASE_WIDTH,
    height: CANVAS_BASE_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },

  /*
   * ELEMENTS
   */

  element: {
    position: 'absolute',
    padding: 3,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 4,
    backgroundColor: 'transparent',
  },

  shapeBox: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },

  imageBox: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },

  elementSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },

  elementLocked: {
    opacity: 0.6,
  },

  elementInner: {
    width: '100%',
    minHeight: 20,
  },

  inlineEditor: {
    width: '100%',
    padding: 2,
    margin: 0,
    backgroundColor: colors.background,
    borderWidth: 0,
  },

  elementTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.6,
  },

  elementSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },

  elementHeading: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#0f172a',
  },

  elementParagraph: {
    fontSize: 12,
    lineHeight: 18,
    color: '#334155',
  },

  elementHighlight: {
    paddingHorizontal: 2,
    borderRadius: 2,
  },

  selectionHandle: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  handleTopLeft: {
    top: -4,
    left: -4,
  },

  handleTopRight: {
    top: -4,
    right: -4,
  },

  handleBottomLeft: {
    bottom: -4,
    left: -4,
  },

  handleBottomRight: {
    bottom: -4,
    right: -4,
  },

  /*
   * CHART
   */

  chartOverlay: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    height: 90,
  },

  chartAxis: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#cbd5e1',
  },

  chart: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },

  chartCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  chartBar: {
    width: '70%',
    minHeight: 2,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  /*
   * TOOLBAR
   */

  toolsArea: {
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 6,
  },

  modeTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 4,
  },

  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
  },

  modeTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },

  modeTabText: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '500',
  },

  modeTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  toolsGrid: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },

  toolBtn: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 5,
    borderRadius: 8,
    gap: 3,
  },

  toolBtnActive: {
    backgroundColor: `${colors.primary}10`,
  },

  toolLabel: {
    fontSize: 9,
    color: colors.mutedForeground,
  },

  pageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 4,
  },

  pageAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  pageActionText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },

  pageActionsDivider: {
    width: StyleSheet.hairlineWidth,
    height: 16,
    backgroundColor: colors.border,
  },
});

export default EditorScreen;
