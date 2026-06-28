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
      {/* Macro strip */}
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

      {/* Input row */}
      <View style={styles.inputRow}>
        <Text style={styles.prompt}>$</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="command"
          placeholderTextColor="#444"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          selectionColor="#4ade80"
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

      {Platform.OS === 'ios' && <View style={styles.homeBar} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#0d0d0d',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1e1e1e',
  },
  macroBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1a1a1a',
  },
  macroContent: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#1a1a1a',
  },
  chipLabel: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  prompt: {
    color: '#4ade80',
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  input: {
    flex: 1,
    color: '#e0e0e0',
    fontSize: 13,
    fontFamily: 'monospace',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  sendBtn: {
    width: 28,
    height: 28,
    borderRadius: 5,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: {
    backgroundColor: '#1a1a1a',
    opacity: 0.5,
  },
  sendIcon: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '700',
  },
  homeBar: { height: 8 },
});
