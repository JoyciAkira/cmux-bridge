import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { Colors, Spacing, FontSizes, Radii } from '../../src/theme';
import { destroyRelayClient } from '../../src/services/relay';
import { useMacsStore } from '../../src/store/macs';
import { usePrefsStore } from '../../src/store/prefs';

export default function SettingsScreen() {
  const macs = useMacsStore((s) => s.macs);
  const { scrollbackLines, terminalFontSize, reduceMotion, setScrollback, setFontSize, setReduceMotion } =
    usePrefsStore();

  const handleDisconnectAll = () => {
    Alert.alert('Disconnect all', 'Close all relay connections?', [
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => macs.forEach((m) => destroyRelayClient(m.id)),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title="Terminal">
        <StepRow
          label="Font size"
          value={terminalFontSize}
          unit="pt"
          min={9}
          max={24}
          onDecrement={() => void setFontSize(terminalFontSize - 1)}
          onIncrement={() => void setFontSize(terminalFontSize + 1)}
        />
        <ScrollbackRow
          value={scrollbackLines}
          onChange={(n) => void setScrollback(n)}
        />
        <SwitchRow
          label="Reduce motion"
          hint="Disables animated scroll"
          value={reduceMotion}
          onToggle={(v) => void setReduceMotion(v)}
        />
      </Section>

      <Section title="Connections">
        <Row label="Active Macs" value={String(macs.length)} />
        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={handleDisconnectAll}
          accessibilityRole="button"
          accessibilityLabel="Disconnect all Macs"
        >
          <Text style={styles.dangerLabel}>Disconnect all</Text>
        </TouchableOpacity>
      </Section>

      <Section title="About">
        <Row label="App" value="Cmux Bridge" />
        <Row label="Version" value="1.0.0" />
        <Row label="Protocol" value="cmux-relay v1" />
        <Row label="License" value="MIT" />
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

function StepRow({
  label, value, unit, min, max, onDecrement, onIncrement,
}: {
  label: string; value: number; unit: string;
  min: number; max: number;
  onDecrement: () => void; onIncrement: () => void;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <View style={stepStyles.controls}>
        <TouchableOpacity
          style={[stepStyles.btn, value <= min && stepStyles.btnDisabled]}
          onPress={onDecrement}
          disabled={value <= min}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={stepStyles.btnLabel}>−</Text>
        </TouchableOpacity>
        <Text style={stepStyles.value}>{value} {unit}</Text>
        <TouchableOpacity
          style={[stepStyles.btn, value >= max && stepStyles.btnDisabled]}
          onPress={onIncrement}
          disabled={value >= max}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={stepStyles.btnLabel}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ScrollbackRow({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [text, setText] = React.useState(String(value));

  const commit = () => {
    const n = parseInt(text, 10);
    if (!isNaN(n)) {
      onChange(n);
      setText(String(Math.min(2000, Math.max(100, n))));
    } else {
      setText(String(value));
    }
  };

  return (
    <View style={rowStyles.row}>
      <View style={{ flex: 1 }}>
        <Text style={rowStyles.label}>Scrollback lines</Text>
        <Text style={rowStyles.hint}>100 – 2000</Text>
      </View>
      <TextInput
        style={scrollbackStyles.input}
        value={text}
        onChangeText={setText}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="number-pad"
        returnKeyType="done"
        selectionColor={Colors.accent}
        accessibilityLabel="Scrollback lines"
      />
    </View>
  );
}

function SwitchRow({
  label, hint, value, onToggle,
}: {
  label: string; hint?: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={rowStyles.row}>
      <View style={{ flex: 1 }}>
        <Text style={rowStyles.label}>{label}</Text>
        {hint ? <Text style={rowStyles.hint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.accent }}
        thumbColor={Colors.text}
        accessibilityLabel={label}
      />
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
  title: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
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
  value: {
    color: Colors.textMuted,
    fontSize: FontSizes.md,
    fontFamily: 'monospace',
    flexShrink: 1,
    textAlign: 'right',
  },
  hint: { color: Colors.textDim, fontSize: FontSizes.sm, marginTop: 2 },
});

const stepStyles = StyleSheet.create({
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  btn: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.3 },
  btnLabel: { color: Colors.text, fontSize: FontSizes.lg, lineHeight: 22 },
  value: { color: Colors.text, fontSize: FontSizes.md, minWidth: 50, textAlign: 'center', fontFamily: 'monospace' },
});

const scrollbackStyles = StyleSheet.create({
  input: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: FontSizes.md,
    fontFamily: 'monospace',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    width: 80,
    textAlign: 'center',
  },
});
