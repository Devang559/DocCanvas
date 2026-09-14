import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, shadowStyles } from './theme';
import { useTheme } from './ThemeContext';

interface AppHeaderProps {
  title: string;
  onCreatePress: () => void;
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
      <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
      <TouchableOpacity
        aria-label="Create new document"
        accessibilityRole="button"
        style={[styles.createBtn, buttonStyle]}
        onPress={onCreatePress}
        activeOpacity={0.7}
      >
        <Plus size={isSm ? 18 : 20} color={colors.primaryForeground} />
      </TouchableOpacity>
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
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
    letterSpacing: 0.25,
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
