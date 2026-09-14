jest.mock('@react-native-async-storage/async-storage', () => {
  const factory = () => Promise.resolve();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(() => Promise.resolve(null)),
      setItem: jest.fn(factory),
      removeItem: jest.fn(factory),
      clear: jest.fn(factory),
      multiGet: jest.fn(() => Promise.resolve([])),
      multiSet: jest.fn(factory),
      multiRemove: jest.fn(factory),
    },
  };
});

jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  const C = (props) => React.createElement(View, null, props.children);
  return {
    __esModule: true,
    default: C,
    enableScreens: jest.fn(() => true),
    enableFreeze: jest.fn(),
    screensEnabled: jest.fn(() => false),
    freezeEnabled: jest.fn(() => false),
    Screen: C,
    InnerScreen: C,
    ScreenStackHeaderConfig: C,
    ScreenStackHeaderSubview: C,
    ScreenStackHeaderLeftView: C,
    ScreenStackHeaderCenterView: C,
    ScreenStackHeaderRightView: C,
    ScreenStackHeaderBackButtonImage: C,
    ScreenStackHeaderSearchBarView: C,
    SearchBar: C,
    ScreenContainer: C,
    ScreenStack: C,
    ScreenStackItem: C,
    FullWindowOverlay: C,
    ScreenFooter: C,
    ScreenContentWrapper: C,
    isSearchBarAvailableForCurrentPlatform: jest.fn(() => false),
    executeNativeBackPress: jest.fn(),
    compatibilityFlags: {},
    featureFlags: {},
    useTransitionProgress: jest.fn(() => ({ progress: 1, closing: 0, goingForward: 1 })),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const zero = { top: 0, right: 0, bottom: 0, left: 0 };
  const SafeAreaInsetsContext = React.createContext(zero);
  const SafeAreaFrameContext = React.createContext({ x: 0, y: 0, width: 0, height: 0 });
  return {
    __esModule: true,
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(zero),
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    useSafeAreaInsets: () => zero,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    initialWindowMetrics: { insets: zero, frame: { x: 0, y: 0, width: 0, height: 0 } },
  };
});
