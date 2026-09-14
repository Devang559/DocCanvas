import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LayoutTemplate } from 'lucide-react-native';
import { colors, shadowStyles } from './theme';
import { Template } from './types';

interface TemplateCardProps {
  template: Template;
  onUse: () => void;
}

const ICON_COLORS: Record<string, string> = {
  Resumes: '#6366f1',
  'Cover letters': '#ec4899',
  Invoices: '#10b981',
  Business: '#f59e0b',
  Notes: '#3b82f6',
  Education: '#8b5cf6',
  Blank: colors.mutedForeground,
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onUse,
}) => {
  const color = ICON_COLORS[template.category] ?? colors.primary;
  return (
    <View style={[styles.card, shadowStyles.card]}>
      <View style={[styles.thumb, { backgroundColor: colors.muted }]}>
        <LayoutTemplate size={28} color={color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{template.name}</Text>
        <Text style={styles.category}>{template.category}</Text>
      </View>
      <TouchableOpacity
        aria-label={`Use ${template.name} template`}
        style={styles.useBtn}
        onPress={onUse}
        activeOpacity={0.7}
      >
        <Text style={styles.useText}>Use template</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
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
    borderRadius: 8,
    height: 112,
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
    marginBottom: 12,
  },
  body: { marginBottom: 12 },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.cardForeground,
  },
  category: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  useBtn: {
    height: 44,
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
    borderRightWidth: 1,
    borderRightColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    borderLeftWidth: 1,
    borderLeftColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default TemplateCard;
