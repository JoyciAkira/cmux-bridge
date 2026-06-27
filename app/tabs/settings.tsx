import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, Radii } from '../../src/theme';
import { destroyRelayClient } from '../../src/services/relay';
import { useMacsStore } from '../../src/store/macs';

export default function SettingsScreen() {
  const macs = useMacsStore((s) => s.macs);

  const handleDisconnectAll = () => {
    Alert.alert('Disconnect all', 'Close all relay connections?', [
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => {
          macs.forEach((m) => destroyRelayClient(m.id));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Section title="Connections">
        <Row label="Active Macs" value={String(macs.length)} />
        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={handleDisconnectAll}
          accessibilityRole="button"
        >
          <Text style={styles.dangerLabel}>Disconnect all</Text>
        </TouchableOpacity>
      </Section>

      <Section title="About">
        <Row label="App" value="Cmux Bridge" />
        <Row label="Version" value="1.0.0" />
        <Row label="Protocol" value="cmux-relay v1" />
        <Row label="License" value="MIT" />
        <Row label="Source" value="github.com/JoyciAkira/cmux-bridge" />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.card}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: Spacing.lg },
  dangerBtn: {
    marginTop: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  dangerLabel: { color: Colors.error, fontSize: FontSizes.md },
});

const sectionStyles = StyleSheet.create({
  wrapper: { gap: Spacing.sm },
  title: { color: Colors.textMuted, fontSize: FontSizes.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: { color: Colors.text, fontSize: FontSizes.md },
  value: { color: Colors.textMuted, fontSize: FontSizes.md, fontFamily: 'monospace', flexShrink: 1, textAlign: 'right' },
});
