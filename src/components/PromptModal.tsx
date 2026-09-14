import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, shadowStyles, borderRadius } from '../utils/theme';

interface PromptModalProps {
  visible: boolean;
  title: string;
  message?: string;
  initialValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  submitLabel?: string;
  keyboardType?: 'default' | 'numeric';
}

export const PromptModal: React.FC<PromptModalProps> = ({
  visible,
  title,
  message,
  initialValue = '',
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  keyboardType = 'default',
}) => {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [visible, initialValue]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
    } else {
      onSubmit(initialValue);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.backdrop}
        onPress={onCancel}
      />
      <View style={styles.sheet}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <TextInput
          value={value}
          onChangeText={setValue}
          style={styles.input}
          placeholder={title}
          autoFocus
          keyboardType={keyboardType}
          onSubmitEditing={handleSubmit}
        />
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.saveBtn]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.saveText}>{submitLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
    ...shadowStyles.floating,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.foreground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  cancelBtn: {},
  saveBtn: {
    backgroundColor: colors.primary,
  },
  cancelText: {
    fontSize: 14,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
});

export default PromptModal;
