import { useCallback, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors, Spacing, FontSizes, Radii } from '../../theme';

interface Props {
  onSend: (text: string) => void;
}

const MACROS: Array<{ label: string; value: string }> = [
  { label: 'ctrl+c', value: '\x03' },
  { label: 'ctrl+d', value: '\x04' },
  { label: 'ctrl+z', value: '\x1A' },
  { label: 'esc',    value: '\x1B' },
  { label: 'tab',    value: '\t' },
  { label: '↑',      value: '\x1B[A' },
  { label: '↓',      value: '\x1B[B' },
  { label: '←',      value: '\x1B[D' },
  { label: '→',      value: '\x1B[C' },
];

export default function InputBar({ onSend }: Props) {
  const [text, setText] = useState('');

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    onSend(text + '\n');
    setText('');
  }, [text, onSend]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.macroScroll}
        contentContainerStyle={styles.macroContent}
        keyboardShouldPersistTaps="always"
      >
        {MACROS.map((m) => (
          <TouchableOpacity
            key={m.label}
            style={styles.macroBtn}
            onPress={() => onSend(m.value)}
            accessibilityLabel={m.label}
            accessibilityRole="button"
          >
            <Text style={styles.macroLabel}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="command…"
          placeholderTextColor={Colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          selectionColor={Colors.accent}
          multiline={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
          accessibilityLabel="Send command"
          accessibilityRole="button"
        >
          <Text style={styles.sendLabel}>↵</Text>
        </TouchableOpacity>
      </View>
      {Platform.OS === 'ios' && <View style={styles.homeIndicator} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  macroScroll: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  macroContent: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    gap: 6,
    alignItems: 'center',
  },
  macroBtn: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    minWidth: 44,
    alignItems: 'center',
  },
  macroLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: FontSizes.md,
    fontFamily: 'monospace',
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    minHeight: 38,
  },
  sendBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.sm,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.accentDim,
    opacity: 0.4,
  },
  sendLabel: {
    color: Colors.background,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  homeIndicator: { height: 8 },
});
