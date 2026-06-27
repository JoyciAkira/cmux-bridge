import { useCallback, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, FontSizes, Radii } from '../../theme';

interface Props {
  onSend: (text: string) => void;
}

const MACROS: Array<{ label: string; value: string }> = [
  { label: 'ctrl+c', value: '\x03' },
  { label: 'ctrl+z', value: '\x1A' },
  { label: 'ctrl+d', value: '\x04' },
  { label: 'esc',    value: '\x1B' },
  { label: 'tab',    value: '\t' },
  { label: '↑',      value: '\x1B[A' },
  { label: '↓',      value: '\x1B[B' },
  { label: '↶',      value: '\x1B[D' },
  { label: '↷',      value: '\x1B[C' },
];

export default function InputBar({ onSend }: Props) {
  const [text, setText] = useState('');

  const handleSend = useCallback(() => {
    if (text.trim().length === 0) return;
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
        />
        <TouchableOpacity
          style={[styles.sendBtn, text.trim().length === 0 && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={text.trim().length === 0}
          accessibilityLabel="Send command"
          accessibilityRole="button"
        >
          <Text style={styles.sendLabel}>↵</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  macroScroll: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  macroContent: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  macroBtn: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  macroLabel: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: FontSizes.md,
    fontFamily: 'monospace',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sendBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.sm,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.accentDim,
    opacity: 0.4,
  },
  sendLabel: {
    color: Colors.background,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
});
