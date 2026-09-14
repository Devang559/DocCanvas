
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  House,
  Files,
  LayoutTemplate,
  Settings,
} from 'lucide-react-native';
import { colors, shadowStyles } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { RootStackParamList } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface TabConfig {
  name: keyof RootStackParamList;
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
  }>;
}

const TABS: TabConfig[] = [
  {
    name: 'Home',
    label: 'Home',
    Icon: House,
  },
  {
    name: 'Documents',
    label: 'Documents',
    Icon: Files,
  },
  {
    name: 'Templates',
    label: 'Templates',
    Icon: LayoutTemplate,
  },
  {
    name: 'Settings',
    label: 'Settings',
    Icon: Settings,
  },
];

export const BottomNavBar: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const focused = useNavigationState(
    (state) => state.routes[state.index].name,
  );

  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handlePress = (name: keyof RootStackParamList) => {
    if (name === focused) {
      return;
    }

    (navigation.navigate as (
      screen: keyof RootStackParamList,
    ) => void)(name);
  };

  return (
    <View
      style={[
        styles.nav,
        shadowStyles.card,
        {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = focused === tab.name;
        const tint = isActive ? colors.primary : theme.foreground;

        return (
          <TouchableOpacity
            key={tab.name}
            aria-label={tab.label}
            accessibilityRole="button"
            style={styles.tab}
            onPress={() => handlePress(tab.name)}
            activeOpacity={0.7}
          >
            <tab.Icon size={20} color={tint} />

            <Text
              style={[
                styles.tabLabel,
                {
                  color: tint,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    minHeight: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default BottomNavBar;