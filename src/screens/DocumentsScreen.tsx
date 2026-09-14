import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import {
  Search,
  SlidersHorizontal,
  Plus,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadowStyles } from './theme';
import { useDocuments } from './DocumentContext';
import { useDocumentActions } from './useDocumentActions';
import AppHeader from './AppHeader';
import Chip from './Chip';
import DocumentListItem from './DocumentListItem';
import PromptModal from './PromptModal';
import BottomNavBar from './BottomNavBar';
import type { Document } from './types';

const CATEGORIES = ['All', 'PDFs', 'Resumes', 'Templates'];

const DocumentsScreen = () => {
  const insets = useSafeAreaInsets();
  const { documents, deleteDocument, updateDocument, createDocument } =
    useDocuments();
  const { createNew, openEditor } = useDocumentActions();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [renameDoc, setRenameDoc] = useState<Document | null>(null);

  const filtered = useCallback(() => {
    let list = documents;
    if (activeCat !== 'All') {
      list = list.filter((d) => d.category === activeCat);
    }
    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.fileName.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => b.lastEdited - a.lastEdited);
  }, [documents, activeCat, search]);

  const handleRename = useCallback(
    (doc: Document) => {
      setRenameDoc(doc);
    },
    [],
  );

  const confirmRename = useCallback(
    (title: string) => {
      if (renameDoc) {
        const ext = renameDoc.extension.toLowerCase();
        const updated = {
          ...renameDoc,
          title,
          fileName: `${title}.${ext === 'pdf' ? 'pdf' : ext === 'tpl' ? 'tpl' : 'docx'}`,
        };
        updateDocument(updated);
      }
      setRenameDoc(null);
    },
    [renameDoc, updateDocument],
  );

  const handleDelete = useCallback(
    (doc: Document) => {
      Alert.alert(
        'Delete document',
        `Delete "${doc.fileName}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteDocument(doc.id),
          },
        ],
      );
    },
    [deleteDocument],
  );

  const handleDuplicate = useCallback(
    (doc: Document) => {
      const copy = createDocument({
        title: `${doc.title} copy`,
        fileName: `${doc.title} copy.${doc.extension.toLowerCase()}`,
        type: doc.type,
        extension: doc.extension,
        category: doc.category,
        pageCount: doc.pageCount,
        content: doc.content,
      });
      openEditor(copy.id);
    },
    [createDocument, openEditor],
  );

  return (
    <View style={[styles.screen, { paddingBottom: 64 + insets.bottom }]}>
      <AppHeader title="DocCanvas" onCreatePress={createNew} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.h1}>Your documents</Text>
          <Text style={styles.subtitle}>
            Everything you create or import, saved on this device.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            placeholder="Search documents"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
          />
          <TouchableOpacity
            aria-label="Filter / sort"
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Sort by',
                'Choose a sort order.',
                [
                  { text: 'Newest first', style: 'default' },
                  { text: 'Name A–Z', style: 'default' },
                  { text: 'Cancel', style: 'cancel' },
                ],
              )
            }
          >
            <SlidersHorizontal size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={styles.chips}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              selected={activeCat === cat}
              onPress={() => setActiveCat(cat)}
              variant="filter"
              ariaLabel={cat}
            />
          ))}
        </View>

        <View style={styles.list}>
          {filtered().length === 0 ? (
            <Text style={styles.empty}>No documents match.</Text>
          ) : (
            filtered().map((doc) => (
              <DocumentListItem
                key={doc.id}
                doc={doc}
                onOpen={() => openEditor(doc.id)}
                onRename={() => handleRename(doc)}
                onDelete={() => handleDelete(doc)}
                onDuplicate={() => handleDuplicate(doc)}
              />
            ))
          )}
        </View>

        <Text style={styles.storageNote}>Files stay on your device.</Text>

        <View style={styles.fabWrapper}>
          <TouchableOpacity
            aria-label="New document"
            style={[styles.fab, shadowStyles.floating]}
            onPress={createNew}
            activeOpacity={0.85}
          >
            <Plus size={20} color={colors.primaryForeground} />
            <Text style={styles.fabText}>New document</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <PromptModal
        visible={!!renameDoc}
        title="Rename document"
        initialValue={renameDoc?.title ?? ''}
        onSubmit={confirmRename}
        onCancel={() => setRenameDoc(null)}
      />
      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 20,
  },
  header: { gap: 8 },
  h1: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.input,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
    paddingVertical: 0,
    minHeight: undefined,
    height: undefined,
    ...Platform.select({
      android: { fontWeight: '400' },
    }),
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: colors.muted,
    borderRadius: 10,
    padding: 4,
  },
  list: { gap: 8 },
  empty: {
    color: colors.mutedForeground,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  storageNote: {
    fontSize: 11,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  fabWrapper: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 44,
  },
  fabText: {
    color: colors.primaryForeground,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default DocumentsScreen;
