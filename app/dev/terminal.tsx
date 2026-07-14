import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import TerminalView from '../../src/components/terminal/TerminalView';
import { useTerminalStore } from '../../src/store/terminal';
import {
  DEV_SURFACE_KEY,
  NEXUS_FIXTURE_COLS,
  NEXUS_FIXTURE_CURSOR,
  NEXUS_FIXTURE_ROWS,
} from '../../src/dev/nexusFixture';
import { Colors, FontSizes, Spacing } from '../../src/theme';

/** DEV-only: real TerminalView + Skia with NEXUS OpenCode fixture (no relay). */
export default function DevTerminalScreen() {
  const insets = useSafeAreaInsets();
  const setScreen = useTerminalStore((s) => s.setScreen);

  useEffect(() => {
    setScreen(DEV_SURFACE_KEY, NEXUS_FIXTURE_ROWS, NEXUS_FIXTURE_COLS, NEXUS_FIXTURE_CURSOR, 1);
  }, [setScreen]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>DEV · NEXUS fixture</Text>
        <View style={styles.spacer} />
      </View>
      <TerminalView surfaceKey={DEV_SURFACE_KEY} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.terminalBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.panelBorder,
    backgroundColor: Colors.panelHeader,
  },
  back: {
    color: Colors.accent,
    fontSize: FontSizes.xl,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  spacer: {
    width: 24,
  },
});
