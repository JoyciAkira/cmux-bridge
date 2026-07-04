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
import { Colors, FontSizes, Spacing, Radii } from '../../theme';

const MACROS: Array<{ label: string; value: string }> = [
  { label: 'C-c', value: '\x03' },
  { label: 'C-d', value: '\x04' },
  { label: 'C-z', value: '\x1A' },
  { label: 'esc', value: '\x1B' },
  { label: 'tab', value: '\t' },
  { label: '↑',   value: '\x1B[A' },
  { label: '↓',   value: '\x1B[B' },
  { label: '←',   value: '\x1B[D' },
  { label: '→',   value: '\x1B[C' },
];

interface Props {
  onSend: (text: string) => void;
}

export default function InputBar({ onSend }: Props) {
  const [text, setText] = useState('');

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    onSend(text + '\n');
    setText('');
  }, [text, onSend]);

  return (
    <View style={styles.root}>
      <View style={styles.macroSection}>
        <Text style={styles.sectionLabel}>KEYS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.macroBar}
          contentContainerStyle={styles.macroContent}
          keyboardShouldPersistTaps="always"
        >
          {MACROS.map((m) => (
            <TouchableOpacity
              key={m.label}
              style={styles.chip}
              onPress={() => onSend(m.value)}
              accessibilityLabel={m.label}
              accessibilityRole="button"
            >
              <Text style={styles.chipLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.sectionLabel}>INPUT</Text>
        <View style={styles.inputRow}>
          <Text style={styles.prompt}>❯</Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type command…"
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
            style={[styles.sendBtn, !text.trim() && styles.sendBtnOff]}
            onPress={handleSend}
            disabled={!text.trim()}
            accessibilityLabel="Send"
            accessibilityRole="button"
          >
            <Text style={styles.sendIcon}>↵</Text>
          </TouchableOpacity>
        </View>
      </View>

      {Platform.OS === 'ios' && <View style={styles.homeBar} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  macroSection: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: Spacing.xs + 2,
    paddingBottom: Spacing.xs,
  },
  inputSection: {
    paddingTop: Spacing.xs + 2,
    paddingBottom: Spacing.sm,
  },
  sectionLabel: {
    color: Colors.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  macroBar: {
    flexGrow: 0,
  },
  macroContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prompt: {
    color: Colors.accent,
    fontSize: FontSizes.md,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontWeight: '700',
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSizes.md,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    paddingVertical: 0,
    includeFontPadding: false,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  sendBtnOff: {
    backgroundColor: Colors.surfaceHigh,
    borderColor: Colors.border,
    opacity: 0.6,
  },
  sendIcon: {
    color: Colors.accent,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  homeBar: { height: Spacing.sm },
});
