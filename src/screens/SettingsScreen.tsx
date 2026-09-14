import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { colors, shadowStyles } from '../utils/theme';
import { useDocuments } from '../context/DocumentContext';
import { useTheme } from '../context/ThemeContext';
import AppHeader from '../components/AppHeader';
import { SelectTrigger } from '../components/SelectDropdown';
import Toast from '../components/Toast';
import BottomNavBar from '../components/BottomNavBar';
import type { Theme } from '../context/ThemeContext';
import {
  useSettings,
  PAGE_SIZE_OPTIONS,
  FONT_OPTIONS,
  EXPORT_QUALITY_OPTIONS,
} from '../context/SettingsContext';

const SettingsSwitchRow: React.FC<{
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  theme: Theme;
}> = ({ label, value, onValueChange, theme }) => (
  <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
    <Text style={[styles.settingLabel, { color: theme.foreground }]}>
      {label}
    </Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#d1d1d1', true: `${colors.primary}80` }}
      thumbColor={value ? colors.primary : '#ffffff'}
    />
  </View>
);

const SettingsSelectRow: React.FC<{
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  theme: Theme;
}> = ({ label, value, options, onSelect, theme }) => (
  <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
    <Text style={[styles.settingLabel, { color: theme.foreground }]}>
      {label}
    </Text>
    <SelectTrigger
      value={value}
      options={options}
      onSelect={onSelect}
      textStyle={{ color: theme.foreground }}
    />
  </View>
);

const SettingsScreen = () => {
  const { settings, updateSetting, reset } = useSettings();
  const { clearAllDocuments } = useDocuments();
  const theme = useTheme();
  const [toast, setToast] = useState('');

  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear recent files',
      'Remove all documents from this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllDocuments();
            setToast('Recent files cleared');
          },
        },
      ],
    );
  }, [clearAllDocuments]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset app data',
      'This will delete all documents and restore default settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllDocuments();
            await reset();
            setToast('App data reset');
          },
        },
      ],
    );
  }, [clearAllDocuments, reset]);

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <AppHeader title="DocCanvas" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={[styles.h1, { color: theme.foreground }]}>Settings</Text>
          <Text style={styles.subtitle}>
            Your documents are stored locally on this device.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <SettingsSelectRow
            label="Default page size"
            value={settings.defaultPageSize}
            options={PAGE_SIZE_OPTIONS}
            onSelect={v => updateSetting('defaultPageSize', v)}
            theme={theme}
          />
          <SettingsSelectRow
            label="Default font"
            value={settings.defaultFont}
            options={FONT_OPTIONS}
            onSelect={v => updateSetting('defaultFont', v)}
            theme={theme}
          />
          <SettingsSwitchRow
            label="Autosave"
            value={settings.autosave}
            onValueChange={v => updateSetting('autosave', v)}
            theme={theme}
          />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <SettingsSwitchRow
            label="Show page thumbnails"
            value={settings.showPageThumbnails}
            onValueChange={v => updateSetting('showPageThumbnails', v)}
            theme={theme}
          />
          <SettingsSwitchRow
            label="Snap to grid"
            value={settings.snapToGrid}
            onValueChange={v => updateSetting('snapToGrid', v)}
            theme={theme}
          />
          <SettingsSwitchRow
            label="Dark mode"
            value={settings.darkMode}
            onValueChange={v => {
              updateSetting('darkMode', v);
              setToast(v ? 'Dark mode enabled' : 'Light mode enabled');
            }}
            theme={theme}
          />
          <SettingsSwitchRow
            label="Haptic feedback"
            value={settings.hapticFeedback}
            onValueChange={v => updateSetting('hapticFeedback', v)}
            theme={theme}
          />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <SettingsSelectRow
            label="Export quality"
            value={settings.exportQuality}
            options={EXPORT_QUALITY_OPTIONS}
            onSelect={v => updateSetting('exportQuality', v)}
            theme={theme}
          />
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity
            aria-label="Clear recent files"
            style={[styles.dangerBtn, shadowStyles.card]}
            onPress={handleClear}
            activeOpacity={0.85}
          >
            <Text style={styles.dangerBtnText}>Clear recent files</Text>
            <ChevronRight size={16} color={colors.destructive} />
          </TouchableOpacity>
          <TouchableOpacity
            aria-label="Reset app data"
            style={[styles.dangerBtn, shadowStyles.card]}
            onPress={handleReset}
            activeOpacity={0.85}
          >
            <Text style={styles.dangerBtnText}>Reset app data</Text>
            <ChevronRight size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>About</Text>
          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutText, { color: theme.foreground }]}>
                DocCanvas
              </Text>
            </View>
            <View style={styles.aboutRowBorder}>
              <Text style={styles.aboutSubtext}>Version 1.0.0</Text>
            </View>
            <TouchableOpacity
              style={styles.aboutRowBorder}
              onPress={() =>
                Alert.alert(
                  'Privacy',
                  'DocCanvas stores all documents locally.',
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.aboutLink}>Privacy information</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aboutRow}
              onPress={() =>
                Alert.alert('Feedback', 'Thank you for using DocCanvas!')
              }
              activeOpacity={0.7}
            >
              <Text style={styles.aboutLink}>Send feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Toast message={toast} visible={!!toast} onDismiss={() => setToast('')} />
      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 20,
  },
  intro: { gap: 8 },
  h1: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dangerSection: { gap: 8 },
  dangerBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    height: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.destructive,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.destructive,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.destructive,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.destructive,
  },
  dangerBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.destructive,
  },
  aboutSection: { gap: 12 },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  aboutRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  aboutRowBorder: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  aboutText: {
    fontSize: 14,
    fontWeight: '500',
  },
  aboutSubtext: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  aboutLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default SettingsScreen;
