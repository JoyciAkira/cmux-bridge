import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useMacsStore } from '../../../src/store/macs';
import { useRelay } from '../../../src/hooks/useRelay';
import TerminalView from '../../../src/components/terminal/TerminalView';
import InputBar from '../../../src/components/terminal/InputBar';
import { scheduleLocalNotification } from '../../../src/services/notifications';
import { getRelayClient } from '../../../src/services/relay';
import { Colors, FontSizes } from '../../../src/theme';

export default function TerminalScreen() {
  const { id, surfaceId, workspaceId, title } = useLocalSearchParams<{
    id: string;
    surfaceId: string;
    workspaceId: string;
    title?: string;
  }>();

  const mac = useMacsStore((s) => s.macs.find((m) => m.id === id));
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
    navigation.setOptions({ headerTitle: () => <HeaderTitle title={title} status={status} /> });
  }, [title, status, navigation]);

  const handleSend = useCallback(
    (text: string) => sendInput(surfaceId, text),
    [sendInput, surfaceId],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <TerminalView surfaceKey={surfaceId} style={styles.terminal} />
      <InputBar onSend={handleSend} />
    </KeyboardAvoidingView>
  );
}

function HeaderTitle({ title, status }: { title?: string; status: string }) {
  const dot = status === 'connected' ? Colors.success : status === 'connecting' ? Colors.warning : Colors.textDim;
  const label = title ? (title.length > 30 ? title.slice(0, 30) + '…' : title) : '…';
  return (
    <View style={header.row}>
      <View style={[header.dot, { backgroundColor: dot }]} />
      <Text style={header.title} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.terminalBg },
  terminal: { flex: 1 },
});

const header = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  title: { color: Colors.text, fontSize: FontSizes.md, fontWeight: '600', fontFamily: 'monospace' },
});
