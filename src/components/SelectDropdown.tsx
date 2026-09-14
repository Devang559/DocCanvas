import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { colors, shadowStyles } from './theme';

interface SelectDropdownProps {
  visible: boolean;
  value: string;
  options: string[];
  onClose: () => void;
  onSelect: (value: string) => void;
  label?: string;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  visible,
  value,
  options,
  onClose,
  onSelect,
  label,
}) => {
  const handleSelect = (val: string) => {
    onSelect(val);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.backdrop}
        onPress={onClose}
      />
      <View style={styles.modal}>
        {label ? <Text style={styles.modalLabel}>{label}</Text> : null}
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = item === value;
            return (
              <TouchableOpacity
                style={[
                  styles.option,
                  isSelected && styles.optionSelected,
                ]}
                onPress={() => handleSelect(item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {isSelected ? (
                  <Check size={16} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
};

interface SelectTriggerProps {
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  style?: object;
  textStyle?: object;
  chevronColor?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  value,
  options,
  onSelect,
  style,
  textStyle,
  chevronColor,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, style]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, textStyle]}>{value}</Text>
        <ChevronDown size={16} color={chevronColor ?? colors.mutedForeground} />
      </TouchableOpacity>
      <SelectDropdown
        visible={open}
        value={value}
        options={options}
        onClose={() => setOpen(false)}
        onSelect={onSelect}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '60%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 8,
    ...shadowStyles.floating,
  },
  modalLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  optionSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  optionText: {
    fontSize: 15,
    color: colors.foreground,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  triggerText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
});
