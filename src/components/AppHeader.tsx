import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Plus, Sparkle } from 'lucide-react-native';
import { colors, shadowStyles } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';

interface AppHeaderProps {
  title: string;
  onCreatePress?: () => void;
  buttonSize?: 'sm' | 'md';
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onCreatePress,
  buttonSize = 'md',
}) => {
  const theme = useTheme();
  const isSm = buttonSize === 'sm';
  const buttonStyle: ViewStyle = {
    width: isSm ? 36 : 44,
    height: isSm ? 36 : 44,
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.card,
          borderBottomColor: theme.border,
          borderTopColor: theme.border,
          borderLeftColor: theme.border,
          borderRightColor: theme.border,
        },
      ]}
    >
      <View style={styles.titleContainer}>
        <Sparkle size={20} color={colors.primary} />
      <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
      </View>
      {onCreatePress ? (
      <TouchableOpacity
        aria-label="Create new document"
        accessibilityRole="button"
        style={[styles.createBtn, buttonStyle]}
        onPress={onCreatePress}
        activeOpacity={0.7}
      >
        <Plus size={isSm ? 18 : 20} color={colors.primaryForeground} />
      </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    flexDirection: 'row',
    paddingHorizontal: 16, 
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadowStyles.card,
  },
});

export default AppHeader;
