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
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useMacsStore } from '../src/store/macs';
import { Colors, Spacing, Radii, FontSizes } from '../src/theme';

export default function OnboardingScreen() {
  const add = useMacsStore((s) => s.add);
  const [label, setLabel] = useState('My Mac');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('4399');
  const [testing, setTesting] = useState<'idle' | 'registering' | 'connecting'>('idle');

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

    setTesting('registering');
    const ok = await testConnection(host.trim(), portNum, (s) => setTesting(s));
    setTesting('idle');

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
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>⌘</Text>
          </View>
          <Text style={styles.heading}>Connect your Mac</Text>
          <Text style={styles.subtitle}>
            Enter your Mac's Tailscale IP and the cmux-relay port.
          </Text>
        </View>

        <View style={styles.form}>
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
            style={[styles.btn, testing !== 'idle' && styles.btnDisabled]}
            onPress={handleSave}
            disabled={testing !== 'idle'}
            accessibilityRole="button"
          >
            <Text style={styles.btnLabel}>
              {testing === 'registering' ? 'Registering…' : testing === 'connecting' ? 'Connecting…' : 'Save & Connect'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.setupBox}>
          <Text style={styles.setupTitle}>Setup cmux-relay on your Mac</Text>
          <Text style={styles.setupStep}>1. Open a terminal in cmux</Text>
          <Text style={styles.setupCode}>~/.cmuxremote/bin/cmux-relay serve \{'\n'}  --config ~/.cmuxremote/relay.json</Text>
          <Text style={styles.setupStep}>2. In cmux Settings → Socket Control Mode → Full open access</Text>
          <Text style={styles.setupStep}>3. Make sure Tailscale is active on both devices</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

async function testConnection(
  host: string,
  port: number,
  onStatus: (s: 'registering' | 'connecting') => void,
): Promise<boolean> {
  try {
    onStatus('registering');
    const res = await fetch(`http://${host}:${port}/v1/devices/me/register`, { method: 'POST' });
    if (!res.ok) return false;
    const { token } = await res.json() as { token: string };

    onStatus('connecting');
    return await new Promise((resolve) => {
      const ws = new WebSocket(`ws://${host}:${port}/v1/ws`, [`bearer.${token}`]);
      const timer = setTimeout(() => { ws.close(); resolve(false); }, 5000);
      ws.onopen = () => { clearTimeout(timer); ws.close(); resolve(true); };
      ws.onerror = () => { clearTimeout(timer); resolve(false); };
    });
  } catch {
    return false;
  }
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
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, gap: Spacing.xl },
  header: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xl },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: Radii.lg,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  logoIcon: { fontSize: 32, color: Colors.accent },
  heading: { color: Colors.text, fontSize: FontSizes.xxl, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: Colors.textMuted, fontSize: FontSizes.md, textAlign: 'center', lineHeight: 22 },
  form: { gap: Spacing.md },
  btn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { color: Colors.background, fontSize: FontSizes.md, fontWeight: '700' },
  setupBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  setupTitle: { color: Colors.text, fontSize: FontSizes.sm, fontWeight: '600', marginBottom: 4 },
  setupStep: { color: Colors.textMuted, fontSize: FontSizes.sm, lineHeight: 20 },
  setupCode: {
    color: Colors.accent,
    fontSize: 11,
    fontFamily: 'monospace',
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    lineHeight: 18,
  },
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
