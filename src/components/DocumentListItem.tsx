import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  FileText,
  MoreHorizontal,
} from 'lucide-react-native';
import { colors, shadowStyles } from '../utils/theme';
import { Document } from '../types';
import { formatRelativeTime } from '../utils/dateUtils';

interface DocumentListItemProps {
  doc: Document;
  onOpen: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

const iconFor = (doc: Document) => {
  const bg =
    doc.type === 'pdf' ? colors.background : colors.background;
  return { bg, label: doc.extension };
};

export const DocumentListItem: React.FC<DocumentListItemProps> = ({
  doc,
  onOpen,
  onRename,
  onDelete,
  onDuplicate,
}) => {
  const info = iconFor(doc);

  const handleMore = () => {
    Alert.alert('Options', undefined, [
      ...(onRename ? [{ text: 'Rename', onPress: onRename, style: 'default' as const }] : []),
      ...(onDuplicate ? [{ text: 'Duplicate', onPress: onDuplicate, style: 'default' as const }] : []),
      ...(onDelete ? [{ text: 'Delete', onPress: onDelete, style: 'destructive' as const }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <View
      style={[styles.article, shadowStyles.card]}
      aria-label={doc.fileName}
    >
      <View style={styles.thumb}>
        <FileText size={20} color={colors.mutedForeground} />
        <Text style={styles.thumbLabel}>{info.label}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {doc.fileName}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {doc.pageCount} pages · {doc.category} ·{' '}
          {formatRelativeTime(doc.lastEdited)}
        </Text>
      </View>
      <TouchableOpacity
        aria-label="Open"
        style={styles.openBtn}
        onPress={onOpen}
        activeOpacity={0.7}
      >
        <Text style={styles.openText}>Open</Text>
      </TouchableOpacity>
      <TouchableOpacity
        aria-label="More options"
        style={styles.moreBtn}
        onPress={handleMore}
        activeOpacity={0.7}
      >
        <MoreHorizontal size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  article: {
    backgroundColor: colors.card,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 80,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  thumb: {
    backgroundColor: colors.muted,
    borderRadius: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 64,
    gap: 2,
  },
  thumbLabel: {
    fontSize: 9,
    marginTop: 2,
    color: colors.mutedForeground,
  },
  content: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.cardForeground,
  },
  subtitle: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  openBtn: {
    paddingHorizontal: 4,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  openText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  moreBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DocumentListItem;
