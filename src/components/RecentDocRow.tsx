import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, shadowStyles } from '../utils/theme';
import { Document } from '../types';
import { formatRelativeTime } from '../utils/dateUtils';

interface FilePreviewThumbProps {
  type: Document['type'];
}

const FilePreviewThumb: React.FC<FilePreviewThumbProps> = ({ type }) => {
  const isPdf = type === 'pdf';
  return (
    <View style={styles.thumb}>
      {isPdf ? (
        <>
          <View style={[styles.bar, styles.barPrimary, styles.barW24]} />
          <View style={[styles.bar, styles.barMuted, styles.barW20]} />
          <View style={[styles.bar, styles.barMuted, styles.barW16]} />
          <View style={[styles.bar, styles.barMuted, styles.barFooter]} />
        </>
      ) : (
        <>
          <View style={[styles.bar, styles.barPrimary, styles.barW24]} />
          <View style={[styles.bar, styles.barMuted, styles.barW20]} />
          <View style={[styles.bar, styles.barMuted, styles.barW16]} />
          <View style={[styles.bar, styles.barMuted, styles.barW12]} />
          <View style={[styles.bar, styles.barMuted, styles.barW20b]} />
        </>
      )}
    </View>
  );
};

interface RecentDocRowProps {
  doc: Document;
  onPress: () => void;
}

export const RecentDocRow: React.FC<RecentDocRowProps> = ({
  doc,
  onPress,
}) => {
  return (
    <TouchableOpacity
      aria-label={`Open ${doc.fileName}`}
      accessibilityRole="button"
      style={[styles.row, shadowStyles.card]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <FilePreviewThumb type={doc.type} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {doc.fileName}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{doc.extension}</Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {doc.pageCount} pages · {formatRelativeTime(doc.lastEdited)}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
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
    flexDirection: 'column',
    gap: 2,
    justifyContent: 'center',
    width: 44,
    height: 56,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  bar: {
    borderRadius: 2,
    height: 2,
  },
  barPrimary: { backgroundColor: `${colors.primary}60` },
  barMuted: { backgroundColor: colors.muted },
  barW24: { width: 24 },
  barW20: { width: 20, marginTop: 2 },
  barW16: { width: 16, marginTop: 2 },
  barW12: { width: 12, marginTop: 2 },
  barW20b: { width: 20, marginTop: 2 },
  barFooter: { width: '100%', height: 12, marginTop: 4, opacity: 0.4 },
  content: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.cardForeground,
    flexShrink: 1,
  },
  badge: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  meta: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});

export default RecentDocRow;
