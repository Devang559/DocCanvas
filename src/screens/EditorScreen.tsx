import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Check,
  ChevronLeft,
  Copy,
  Highlighter,
  Image,
  MoreHorizontal,
  PenLine,
  Plus,
  Redo2,
  RotateCw,
  Share2,
  Signature,
  Square,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react-native';
import { colors, shadowStyles } from './theme';
import { useDocuments } from './DocumentContext';
import { useHistory } from './useHistory';
import Toast from './Toast';
import PromptModal from './PromptModal';
import type { Document, DocumentPage, DocumentContent } from './types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

type EditMode = 'edit' | 'annotate';

const TOOLS: {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { key: 'Text', label: 'Text', icon: Type },
  { key: 'Image', label: 'Image', icon: Image },
  { key: 'Shape', label: 'Shape', icon: Square },
  { key: 'Signature', label: 'Signature', icon: Signature },
  { key: 'Highlight', label: 'Highlight', icon: Highlighter },
  { key: 'Draw', label: 'Draw', icon: PenLine },
  { key: 'More', label: 'More', icon: MoreHorizontal },
];

const EditorScreen: React.FC<Props> = ({ route, navigation }) => {
  const { documentId } = route.params;
  const { loading, getDocument, updateDocument } =
    useDocuments();

  const doc = loading ? undefined : getDocument(documentId);
  const pagesSeed = useMemo(() => makePages(doc), [doc]);
  const {
    state: pages,
    push,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<DocumentPage[]>(pagesSeed);

  const [activeIndex, setActiveIndex] = useState(0);
  const [editMode, setEditMode] = useState<EditMode>('edit');
  const [currentTool, setCurrentTool] = useState('Text');
  const [toast, setToast] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);

  useEffect(() => {
    set(pagesSeed);
  }, [pagesSeed, set]);

   const activePage = pages[activeIndex] ?? pages[0];
  const content = activePage?.content;

  const syncContentToDoc = useCallback(
    (newPages: DocumentPage[]) => {
      if (!doc) return;
      const active = newPages[activeIndex];
      if (!active) return;
      updateDocument({
        ...doc,
        title: active.content.title || doc.title,
        content: active.content,
        pageCount: newPages.length,
      });
    },
    [activeIndex, doc, updateDocument],
  );

  const addPage = useCallback(() => {
    const baseContent: DocumentContent = {
      title: doc?.content.title ?? doc?.title ?? 'Untitled page',
      subtitle: doc?.content.subtitle,
      sections: [],
    };
    const newPage: DocumentPage = {
      id: `page-${Date.now()}`,
      content: baseContent,
      rotation: 0,
    };
    const newPages = [...pages, newPage];
    push(newPages);
    setActiveIndex(newPages.length - 1);
    syncContentToDoc(newPages);
    setToast('Page added');
  }, [doc, pages, push, syncContentToDoc]);

  const duplicatePage = useCallback(() => {
    const dup = { ...pages[activeIndex], id: `page-${Date.now()}` };
    const newPages = [...pages.slice(0, activeIndex), dup, ...pages.slice(activeIndex)];
    push(newPages);
    syncContentToDoc(newPages);
    setToast('Page duplicated');
  }, [activeIndex, pages, push, syncContentToDoc]);

  const deletePage = useCallback(() => {
    const count = pages.length;
    if (count <= 1) {
      Alert.alert('Cannot delete', 'You need at least one page.');
      return;
    }
    Alert.alert('Delete page', 'Delete this page?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const newPages = pages.filter((_, i) => i !== activeIndex);
          const newIndex =
            activeIndex >= newPages.length ? newPages.length - 1 : activeIndex;
          push(newPages);
          setActiveIndex(newIndex);
          syncContentToDoc(newPages);
          setToast('Page deleted');
        },
      },
    ]);
  }, [activeIndex, pages, push, syncContentToDoc]);

  const rotatePage = useCallback(() => {
    const page = pages[activeIndex];
    if (!page) return;
    const next = page.rotation === 270 ? 0 : (page.rotation ?? 0) + 90;
    const newPages = [...pages];
    newPages[activeIndex] = { ...page, rotation: next };
    push(newPages);
    syncContentToDoc(newPages);
    setToast('Rotated 90°');
  }, [activeIndex, pages, push, syncContentToDoc]);

  const handleUndo = () => {
    if (canUndo) {
      undo();
      syncContentToDoc(pages);
      setToast('Undo');
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      redo();
      syncContentToDoc(pages);
      setToast('Redo');
    }
  };

  const handleShare = () => {
    Alert.alert('Share', 'Export and share this document.', [
      { text: 'Copy link', onPress: () => setToast('Link copied') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleTool = (key: string) => {
    if (key === 'More') {
      Alert.alert('Tools', 'Choose an option', [
        { text: 'Underline', style: 'default' },
        { text: 'Strikethrough', style: 'default' },
        { text: 'Table', style: 'default' },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    setCurrentTool(key);
    setEditMode('edit');
    setToast(`${key} selected`);
  };

  const handleRename = useCallback(
    (newTitle: string) => {
      if (!doc || !content) return;
      const newPages = [...pages];
      newPages[activeIndex] = {
        ...newPages[activeIndex],
        content: { ...content, title: newTitle },
      };
      const newDoc = { ...doc, title: newTitle, fileName: newTitle };
      updateDocument(newDoc);
      push(newPages);
      setToast('Title updated');
    },
    [activeIndex, content, doc, pages, push, updateDocument],
  );

  const rotation = pages[activeIndex]?.rotation ?? 0;

  if (loading || !doc) {
    return (
      <View style={[styles.screen, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        {!doc ? (
          <Text style={styles.notFoundText}>Document not found</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          aria-label="Back"
          accessibilityRole="button"
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <TouchableOpacity
            onLongPress={() => setRenameOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.headerName} numberOfLines={1}>
              {doc.fileName}
            </Text>
          </TouchableOpacity>
          <View style={styles.savedRow}>
            <Check size={12} color={colors.primary} />
            <Text style={styles.savedText}>Saved</Text>
          </View>
        </View>
        <TouchableOpacity
          aria-label="Undo"
          style={styles.headerBtn}
          onPress={handleUndo}
          activeOpacity={0.7}
          disabled={!canUndo}
        >
          <Undo2 size={18} color={canUndo ? colors.foreground : colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          aria-label="Redo"
          style={styles.headerBtn}
          onPress={handleRedo}
          activeOpacity={0.7}
          disabled={!canRedo}
        >
          <Redo2 size={18} color={canRedo ? colors.foreground : colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          aria-label="Share"
          style={styles.headerBtn}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Share2 size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.pageStripWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pageStrip}
        >
          {pages.map((page, idx) => {
            const isActive = idx === activeIndex;
            return (
              <TouchableOpacity
                key={page.id}
                aria-label={`Page ${idx + 1}`}
                accessibilityRole="button"
                style={[
                  styles.pageThumb,
                  isActive && styles.pageThumbActive,
                ]}
                onPress={() => setActiveIndex(idx)}
                activeOpacity={0.7}
              >
                <View style={styles.thumbInner}>
                  <View style={styles.thumbTop} />
                  <View style={[styles.thumbLine, styles.thumbLineShort]} />
                  <View style={[styles.thumbLine, styles.thumbLineShort2]} />
                </View>
                <View
                  style={[
                    styles.pageNum,
                    isActive && styles.pageNumActive,
                  ]}
                >
                  <Text style={styles.pageNumText}>{idx + 1}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            aria-label="Add page"
            accessibilityRole="button"
            style={styles.addPageBtn}
            onPress={addPage}
            activeOpacity={0.7}
          >
            <Plus size={18} color={colors.primary} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.canvasWrapper}>
        <View
          style={[
            styles.canvas,
            { transform: [{ rotate: `${rotation}deg` }] },
            rotation !== 0 && styles.canvasRotated,
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.canvasContent}
            showsVerticalScrollIndicator={false}
          >
            {content ? renderContent(content) : null}
            <View style={styles.previewBox}>
              <View style={styles.previewLine} />
              <View style={[styles.previewLine, styles.previewLineShort]} />
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.toolsArea}>
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              editMode === 'edit' && styles.modeTabActive,
            ]}
            onPress={() => setEditMode('edit')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeTabText,
                editMode === 'edit' && styles.modeTabTextActive,
              ]}
            >
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeTab,
              editMode === 'annotate' && styles.modeTabActive,
            ]}
            onPress={() => setEditMode('annotate')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeTabText,
                editMode === 'annotate' && styles.modeTabTextActive,
              ]}
            >
              Annotate
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toolsGrid}>
          {TOOLS.map((tool) => {
            const isActive = currentTool === tool.key;
            return (
              <TouchableOpacity
                key={tool.key}
                aria-label={tool.label}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.toolBtn,
                  isActive && styles.toolBtnActive,
                ]}
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
        </View>

        <View style={styles.pageActions}>
          <Text style={styles.pageActionsDivider} />
          <TouchableOpacity
            aria-label="Duplicate page"
            accessibilityRole="button"
            style={styles.pageAction}
            onPress={duplicatePage}
            activeOpacity={0.7}
          >
            <Copy size={14} color={colors.mutedForeground} />
            <Text style={styles.pageActionText}>Duplicate page</Text>
          </TouchableOpacity>
          <View style={styles.pageActionsDivider} />
          <TouchableOpacity
            aria-label="Rotate"
            accessibilityRole="button"
            style={styles.pageAction}
            onPress={rotatePage}
            activeOpacity={0.7}
          >
            <RotateCw size={14} color={colors.mutedForeground} />
            <Text style={styles.pageActionText}>Rotate</Text>
          </TouchableOpacity>
          <View style={styles.pageActionsDivider} />
          <TouchableOpacity
            aria-label="Delete"
            accessibilityRole="button"
            style={styles.pageAction}
            onPress={deletePage}
            activeOpacity={0.7}
          >
            <Trash2 size={14} color={colors.destructive} />
            <Text style={[styles.pageActionText, { color: colors.destructive }]}>
              Delete
            </Text>
          </TouchableOpacity>
          <Text style={styles.pageActionsDivider} />
        </View>
      </View>

      <Toast message={toast} visible={!!toast} onDismiss={() => setToast('')} />
      <PromptModal
        visible={renameOpen}
        title="Rename document"
        initialValue={doc.title}
        onSubmit={handleRename}
        onCancel={() => setRenameOpen(false)}
      />
    </View>
  );
};

function makePages(doc: Document | undefined): DocumentPage[] {
  if (!doc) {
    return [{ id: 'page-0', content: { title: 'Untitled', sections: [] } }];
  }
  const count = Math.max(doc.pageCount, 1);
  const pages: DocumentPage[] = [];
  for (let i = 0; i < count; i++) {
    pages.push({
      id: `page-${i}`,
      content:
        i === 0
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

function renderContent(content: DocumentContent) {
  return (
    <View>
      <Text style={editorStyles.docTitle}>{content.title || 'Untitled document'}</Text>
      {content.subtitle ? (
        <Text style={editorStyles.docSubtitle}>{content.subtitle}</Text>
      ) : null}
      {content.sections.map((section) => (
        <View key={section.id} style={editorStyles.docSection}>
          {section.heading ? (
            <Text style={editorStyles.docHeading}>{section.heading}</Text>
          ) : null}
          {section.paragraphs.length > 0 ? (
            section.paragraphs.map((p, i) => (
              <Text key={i} style={editorStyles.docParagraph}>
                {p || placeholderBar()}
              </Text>
            ))
          ) : (
            <PlaceholderBars count={3} />
          )}
        </View>
      ))}
      {content.goalBars ? renderChart(content.goalBars) : null}
    </View>
  );
}

function placeholderBar() {
  return ' — ';
}

function placeholderBarStyle(index: number) {
  const width = Math.max(80 - index * 10, 20);
  return {
    height: 2,
    backgroundColor: colors.slate[300],
    borderRadius: 2,
    width: `${width}%`,
  };
}

function PlaceholderBars({ count }: { count: number }) {
  return (
    <View style={styles.placeholderBars}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={placeholderBarStyle(i)} />
      ))}
    </View>
  );
}

function chartBarStyle(value: number, max: number) {
  return {
    height: (value / max) * 80,
    backgroundColor: colors.primary,
  };
}

function renderChart(bars: number[]) {
  const max = Math.max(...bars, 1);
  return (
    <View style={editorStyles.chartWrapper}>
      <View style={editorStyles.chartAxis} />
      <View style={editorStyles.chart}>
        {bars.map((v, i) => (
          <View key={i} style={editorStyles.chartCol}>
            <View style={[editorStyles.chartBar, chartBarStyle(v, max)]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  loadingContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  notFoundText: {
    color: colors.mutedForeground,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    height: 48,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, minWidth: 0 },
  headerName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  savedText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  pageStripWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  pageStrip: {
    gap: 8,
    alignItems: 'center',
    paddingRight: 8,
  },
  pageThumb: {
    width: 48,
    height: 64,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pageThumbActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  thumbInner: { alignItems: 'center', gap: 3 },
  thumbTop: {
    width: 32,
    height: 3,
    backgroundColor: `${colors.primary}60`,
    borderRadius: 2,
  },
  thumbLine: {
    height: 2,
    backgroundColor: colors.muted,
    borderRadius: 2,
    width: 28,
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
    bottom: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    overflow: 'visible',
  },
  canvas: {
    width: '100%',
    maxWidth: 372,
    maxHeight: 520,
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
    ...shadowStyles.floating,
  },
  canvasRotated: {
    maxWidth: 520,
    maxHeight: 372,
  },
  canvasContent: {
    padding: 32,
    paddingBottom: 40,
  },
  toolsArea: {
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: 10,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
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
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  toolBtn: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  toolBtnActive: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
  },
  toolLabel: {
    fontSize: 9,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  pageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  pageActionsDivider: {
    flex: 0,
    width: StyleSheet.hairlineWidth,
    height: 16,
    backgroundColor: colors.border,
  },
  pageAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  pageActionText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  previewBox: {
    marginTop: 16,
    alignSelf: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    padding: 6,
    width: 96,
  },
  previewLine: {
    height: 2,
    backgroundColor: colors.muted,
    borderRadius: 2,
    marginBottom: 3,
    width: '100%',
  },
  previewLineShort: {
    width: '80%',
  },
  placeholderBars: {
    gap: 4,
    marginTop: 4,
  },
});

const editorStyles = StyleSheet.create({
  docTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  docSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  docSection: { marginBottom: 20 },
  docHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  docParagraph: {
    fontSize: 12,
    color: '#334159',
    lineHeight: 18,
    marginBottom: 4,
  },
  chartWrapper: {
    marginTop: 24,
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  chartAxis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#cbd5e1',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 80,
  },
  chartCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  chartBar: {
    width: '80%',
    minHeight: 2,
    borderRadius: 2,
  },
});

export default EditorScreen;
