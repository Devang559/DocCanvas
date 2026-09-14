import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, shadowStyles, borderRadius } from './theme';

interface ToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  duration = 1500,
  onDismiss,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(duration - 300),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss();
      });
    }
  }, [visible, duration, opacity, onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.toast, { opacity }, shadowStyles.floating, style]}
      pointerEvents="none"
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignSelf: 'center',
    backgroundColor: colors.foreground,
    borderRadius: borderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: '80%',
  },
  toastText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Toast;
