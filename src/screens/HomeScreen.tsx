import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Plus,
  Upload,
  FilePlus2,
  FileText,
  Mail,
  ReceiptText,
  NotebookPen,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadowStyles } from './theme';
import { useDocuments } from './DocumentContext';
import { useDocumentActions } from './useDocumentActions';
import AppHeader from './AppHeader';
import TileButton from './TileButton';
import RecentDocRow from './RecentDocRow';
import BottomNavBar from './BottomNavBar';
import type { Template } from './types';
import type { ComponentType } from 'react';

const QUICK_TILES: {
  label: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  action: 'blank' | 'resume' | 'letter' | 'invoice' | 'meeting';
}[] = [
  { label: 'Blank document', icon: FilePlus2, action: 'blank' },
  { label: 'Resume', icon: FileText, action: 'resume' },
  { label: 'Letter', icon: Mail, action: 'letter' },
  { label: 'Invoice', icon: ReceiptText, action: 'invoice' },
  { label: 'Meeting notes', icon: NotebookPen, action: 'meeting' },
];

const TILE_GAP = 8;
const screenW = Dimensions.get('window').width;
const tileW = (screenW - 32 - TILE_GAP * 2) / 3;

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { documents, templates } = useDocuments();
  const { createNew, applyTemplate, viewAll, openEditor, confirmImport } =
    useDocumentActions();

  const handleTile = useCallback(
    (action: string) => {
      const find = (cat: string): Template | undefined =>
        templates.find((t) => t.category === cat);
      switch (action) {
        case 'blank':
          createNew();
          break;
        case 'resume':
          applyTemplate(find('Resumes')!);
          break;
        case 'letter':
          applyTemplate(find('Business')!);
          break;
        case 'invoice':
          applyTemplate(find('Invoices')!);
          break;
        case 'meeting':
          applyTemplate(find('Notes')!);
          break;
        default:
          break;
      }
    },
    [createNew, applyTemplate, templates],
  );

  const recent = [...documents]
    .sort((a, b) => b.lastEdited - a.lastEdited)
    .slice(0, 3);

  return (
    <View style={[styles.screen, { paddingBottom: 64 + insets.bottom }]}>
      <AppHeader title="DocCanvas" onCreatePress={createNew} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.h1}>Create something great</Text>
          <Text style={styles.subtitle}>
            Edit PDFs, build documents, and start from a template.
          </Text>
        </View>

        <View style={styles.actionBtns}>
          <TouchableOpacity
            aria-label="Create new document"
            style={[styles.primaryBtn, shadowStyles.card]}
            onPress={createNew}
            activeOpacity={0.85}
          >
            <Plus size={16} color={colors.primaryForeground} />
            <Text style={styles.primaryBtnText}>Create new document</Text>
          </TouchableOpacity>
          <TouchableOpacity
            aria-label="Import PDF"
            style={[styles.outlineBtn, shadowStyles.card]}
            onPress={confirmImport}
            activeOpacity={0.85}
          >
            <Upload size={16} color={colors.foreground} />
            <Text style={styles.outlineBtnText}>Import PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tilesRow}>
          {QUICK_TILES.map((t) => (
            <View key={t.label} style={{ width: tileW }}>
              <TileButton
                icon={t.icon}
                label={t.label}
                iconColor={colors.primary}
                onPress={() => handleTile(t.action)}
                ariaLabel={t.label}
              />
            </View>
          ))}
        </View>

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.h2}>Recent documents</Text>
            <TouchableOpacity
              aria-label="View all documents"
              onPress={viewAll}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.storageNote}>
            Your documents are stored locally on this device.
          </Text>
          <View style={styles.recentList}>
            {recent.length === 0 ? (
              <Text style={styles.empty}>No recent documents yet.</Text>
            ) : (
              recent.map((doc) => (
                <RecentDocRow
                  key={doc.id}
                  doc={doc}
                  onPress={() => openEditor(doc.id)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 24,
  },
  hero: { gap: 8 },
  h1: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
  },
  actionBtns: { gap: 8 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: 48,
  },
  primaryBtnText: {
    color: colors.primaryForeground,
    fontSize: 13,
    fontWeight: '500',
  },
  outlineBtn: {
    backgroundColor: colors.background,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  outlineBtnText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '500',
  },
  tilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
  },
  recentSection: { gap: 12 },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  h2: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    letterSpacing: -0.25,
  },
  viewAll: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  storageNote: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  recentList: { gap: 8 },
  empty: {
    color: colors.mutedForeground,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
});

export default HomeScreen;
