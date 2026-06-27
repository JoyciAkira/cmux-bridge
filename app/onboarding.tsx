import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useMacsStore } from '../src/store/macs';
import { Colors, Spacing, Radii, FontSizes } from '../src/theme';

export default function OnboardingScreen() {
  const add = useMacsStore((s) => s.add);
  const [label, setLabel] = useState('My Mac');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('4399');
  const [testing, setTesting] = useState(false);

  const handleSave = useCallback(async () => {
    if (!host.trim()) {
      Alert.alert('Missing host', 'Enter your Mac\'s Tailscale IP address.');
      return;
    }
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      Alert.alert('Invalid port', 'Port must be between 1 and 65535.');
      return;
    }

    setTesting(true);
    // Quick connectivity test: attempt WebSocket connection with 5s timeout
    const ok = await testConnection(host.trim(), portNum);
    setTesting(false);

    if (!ok) {
      Alert.alert(
        'Cannot connect',
        `Could not reach ${host.trim()}:${portNum}.\n\nCheck that:\n• Tailscale is active on both devices\n• cmux-relay is running on the Mac\n• The port is correct (default 4399)`,
        [
          { text: 'Save anyway', onPress: () => saveAndGo() },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    saveAndGo();
  }, [label, host, port, add]);

  const saveAndGo = useCallback(async () => {
    const portNum = parseInt(port, 10);
    const entry = await add({ label: label.trim() || 'My Mac', host: host.trim(), port: portNum });
    router.replace(`/mac/${entry.id}`);
  }, [label, host, port, add]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.form}>
        <Text style={styles.heading}>Add your Mac</Text>
        <Text style={styles.subtitle}>
          Enter your Mac's Tailscale IP and the cmux-relay port.
        </Text>

        <Field label="Label" value={label} onChangeText={setLabel} placeholder="Work MacBook" />
        <Field
          label="Tailscale IP"
          value={host}
          onChangeText={setHost}
          placeholder="100.x.x.x"
          keyboardType="decimal-pad"
          autoFocus
        />
        <Field
          label="Port"
          value={port}
          onChangeText={setPort}
          placeholder="4399"
          keyboardType="number-pad"
        />

        <TouchableOpacity
          style={[styles.btn, testing && styles.btnDisabled]}
          onPress={handleSave}
          disabled={testing}
          accessibilityRole="button"
        >
          <Text style={styles.btnLabel}>{testing ? 'Testing connection…' : 'Save & Connect'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

async function testConnection(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://${host}:${port}/ws`);
    const timer = setTimeout(() => { ws.close(); resolve(false); }, 5000);
    ws.onopen = () => { clearTimeout(timer); ws.close(); resolve(true); };
    ws.onerror = () => { clearTimeout(timer); resolve(false); };
  });
}

function Field({
  label,
  ...inputProps
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={Colors.accent}
        placeholderTextColor={Colors.textDim}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  form: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
    justifyContent: 'center',
  },
  heading: {
    color: Colors.text,
    fontSize: FontSizes.xxl,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSizes.md,
    lineHeight: 22,
    marginTop: -Spacing.sm,
  },
  btn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { color: Colors.background, fontSize: FontSizes.md, fontWeight: '700' },
});

const fieldStyles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  label: { color: Colors.textMuted, fontSize: FontSizes.sm, fontWeight: '500' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: FontSizes.md,
    fontFamily: 'monospace',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
