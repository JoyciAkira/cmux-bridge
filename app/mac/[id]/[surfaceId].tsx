import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useMacsStore } from '../../../src/store/macs';
import { useRelay } from '../../../src/hooks/useRelay';
import { useTerminalStore } from '../../../src/store/terminal';
import TerminalView from '../../../src/components/terminal/TerminalView';
import InputBar from '../../../src/components/terminal/InputBar';
import StatusBadge from '../../../src/components/ui/StatusBadge';
import { scheduleLocalNotification } from '../../../src/services/notifications';
import { getRelayClient, type RelayStatus } from '../../../src/services/relay';
import { Colors, Spacing, FontSizes, Radii } from '../../../src/theme';

export default function TerminalScreen() {
  const { id, surfaceId, workspaceId, title } = useLocalSearchParams<{
    id: string;
    surfaceId: string;
    workspaceId: string;
    title?: string;
  }>();

  const mac = useMacsStore((s) => s.macs.find((m) => m.id === id));
  const lineCount = useTerminalStore((s) => s.surfaces[surfaceId ?? '']?.lines.length ?? 0);
  const navigation = useNavigation();

  const { subscribe, unsubscribe, sendInput, status } = useRelay(
    id,
    mac?.host ?? '',
    mac?.port ?? 4399,
  );

  useEffect(() => {
    if (!workspaceId || !surfaceId) return;
    subscribe(workspaceId, surfaceId);
    return () => unsubscribe(workspaceId, surfaceId);
  }, [workspaceId, surfaceId, subscribe, unsubscribe]);

  useEffect(() => {
    const client = getRelayClient(id);
    const handler = (msg: { event: string; workspaceId: string; message?: string }) => {
      const validEvents = ['agent_complete', 'agent_error', 'awaiting_input'] as const;
      const ev = validEvents.find((e) => e === msg.event);
      if (ev) scheduleLocalNotification(ev, msg.workspaceId, msg.message);
    };
    client.on('event', handler);
    return () => { client.off('event', handler); };
  }, [id]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <HeaderTitle title={title} status={status} />,
      headerStyle: { backgroundColor: Colors.surface },
    });
  }, [title, status, navigation]);

  const handleSend = useCallback(
    (text: string) => sendInput(surfaceId, text),
    [sendInput, surfaceId],
  );

  const sessionTitle = title
    ? (title.length > 28 ? `${title.slice(0, 28)}…` : title)
    : 'Terminal session';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.sessionBar}>
        <View style={styles.sessionLeft}>
          <Text style={styles.sessionEyebrow}>ACTIVE SURFACE</Text>
          <Text style={styles.sessionTitle} numberOfLines={1}>{sessionTitle}</Text>
        </View>
        <View style={styles.sessionRight}>
          <Text style={styles.lineCount}>{lineCount} lines</Text>
          <StatusBadge status={status} />
        </View>
      </View>

      <View style={styles.terminalFrame}>
        <TerminalView surfaceKey={surfaceId} />
      </View>

      <InputBar onSend={handleSend} />
    </KeyboardAvoidingView>
  );
}

function HeaderTitle({ title, status }: { title?: string; status: RelayStatus }) {
  const dot = status === 'connected'
    ? Colors.success
    : status === 'connecting'
      ? Colors.warning
      : Colors.textDim;
  const label = title ? (title.length > 24 ? `${title.slice(0, 24)}…` : title) : '…';
  return (
    <View style={header.row}>
      <View style={[header.dot, { backgroundColor: dot }]} />
      <Text style={header.title} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sessionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  sessionLeft: {
    flex: 1,
    gap: 2,
  },
  sessionEyebrow: {
    color: Colors.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  sessionTitle: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  sessionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lineCount: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  terminalFrame: {
    flex: 1,
    margin: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    backgroundColor: Colors.terminalBg,
  },
});

const header = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  title: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
});
