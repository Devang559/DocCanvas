import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Settings {
  defaultPageSize: string;
  defaultFont: string;
  autosave: boolean;
  showPageThumbnails: boolean;
  snapToGrid: boolean;
  darkMode: boolean;
  hapticFeedback: boolean;
  exportQuality: string;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultPageSize: 'A4',
  defaultFont: 'Inter',
  autosave: true,
  showPageThumbnails: true,
  snapToGrid: false,
  darkMode: false,
  hapticFeedback: true,
  exportQuality: 'High',
};

export const PAGE_SIZE_OPTIONS = ['A4', 'Letter'];
export const FONT_OPTIONS = ['Inter', 'Arial', 'Georgia'];
export const EXPORT_QUALITY_OPTIONS = ['High', 'Medium', 'Low'];

export const STORAGE_KEY = '@doccanvas:settings';

interface SettingsContextValue {
  settings: Settings;
  loaded: boolean;
  updateSetting: <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => void;
  reset: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        }
      } catch {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(
        () => {},
      );
    }
  }, [settings, loaded]);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const reset = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, loaded, updateSetting, reset }),
    [settings, loaded, updateSetting, reset],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
};
