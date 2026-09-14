import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, borderRadius } from './theme';

export type ChipVariant = 'filter' | 'category' | 'tab';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  variant?: ChipVariant;
  style?: StyleProp<ViewStyle>;
  ariaLabel?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  variant = 'filter',
  style,
  ariaLabel,
}) => {
  const selectedStyle =
    variant === 'category'
      ? selected
        ? styles.categorySelected
        : styles.category
      : selected
      ? styles.filterSelected
      : styles.filter;

  return (
    <TouchableOpacity
      aria-label={ariaLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.base, selectedStyle, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          selected ? styles.labelSelected : styles.labelDefault,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.md,
    paddingVertical: 6,
    paddingHorizontal: 14,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  labelDefault: { color: colors.mutedForeground },
  labelSelected: { color: colors.primaryForeground },
  filter: {
    backgroundColor: colors.muted,
  },
  filterSelected: {
    backgroundColor: colors.primary,
  },
  category: {
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  categorySelected: {
    backgroundColor: `${colors.primary}10`,
    borderColor: colors.primary,
  },
});

export default Chip;
