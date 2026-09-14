import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, shadowStyles } from '../utils/theme';

interface TileButtonProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  iconColor?: string;
  onPress: () => void;
  ariaLabel?: string;
}

export const TileButton: React.FC<TileButtonProps> = ({
  icon: Icon,
  label,
  iconColor,
  onPress,
  ariaLabel,
}) => {
  return (
    <TouchableOpacity
      aria-label={ariaLabel ?? label}
      accessibilityRole="button"
      style={[styles.tile, shadowStyles.card]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon size={20} color={iconColor ?? colors.primary} />
      <Text style={styles.tileLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 80,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.cardForeground,
    textAlign: 'center',
  },
});

export default TileButton;
