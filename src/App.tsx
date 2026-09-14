import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

import { RootStackParamList } from './types';
import { DocumentProvider } from './DocumentContext';
import { SettingsProvider, useSettings } from './SettingsContext';
import { ThemeProvider } from './ThemeContext';
import HomeScreen from './HomeScreen';
import DocumentsScreen from './DocumentsScreen';
import TemplatesScreen from './TemplatesScreen';
import EditorScreen from './EditorScreen';
import SettingsScreen from './SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  return (
    <ThemeProvider dark={dark}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Documents" component={DocumentsScreen} />
          <Stack.Screen name="Templates" component={TemplatesScreen} />
          <Stack.Screen name="Editor" component={EditorScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <DocumentProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </DocumentProvider>
    </SafeAreaProvider>
  );
}

export default App;
