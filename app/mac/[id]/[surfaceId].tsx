import { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useMacsStore } from '../../../src/store/macs';
import { useRelay } from '../../../src/hooks/useRelay';
import TerminalView from '../../../src/components/terminal/TerminalView';
import InputBar from '../../../src/components/terminal/InputBar';
import { scheduleLocalNotification } from '../../../src/services/notifications';
import { getRelayClient } from '../../../src/services/relay';
import { Colors } from '../../../src/theme';

export default function TerminalScreen() {
  const { id, surfaceId, workspaceId } = useLocalSearchParams<{
    id: string;
    surfaceId: string;
    workspaceId: string;
  }>();

  const mac = useMacsStore((s) => s.macs.find((m) => m.id === id));
  const navigation = useNavigation();
  const surfaceKey = `${workspaceId}:${surfaceId}`;

  const { subscribe, unsubscribe, sendInput } = useRelay(
    id,
    mac?.host ?? '',
    mac?.port ?? 4399,
  );

  // Subscribe to this surface on mount, unsubscribe on unmount
  useEffect(() => {
    if (!workspaceId || !surfaceId) return;
    subscribe(workspaceId, surfaceId);
    return () => unsubscribe(workspaceId, surfaceId);
  }, [workspaceId, surfaceId, subscribe, unsubscribe]);

  // Listen for agent events and deliver local notifications
  useEffect(() => {
    const client = getRelayClient(id);
    const handler = (msg: { event: string; workspaceId: string; message?: string }) => {
      const validEvents = ['agent_complete', 'agent_error', 'awaiting_input'] as const;
      const ev = validEvents.find((e) => e === msg.event);
      if (ev) {
        scheduleLocalNotification(ev, msg.workspaceId, msg.message);
      }
    };
    client.on('event', handler);
    return () => { client.off('event', handler); };
  }, [id]);

  useEffect(() => {
    if (surfaceId) navigation.setOptions({ title: surfaceId });
  }, [surfaceId, navigation]);

  const handleSend = useCallback(
    (text: string) => sendInput(text),
    [sendInput],
  );

  return (
    <View style={styles.container}>
      <TerminalView surfaceKey={surfaceKey} style={styles.terminal} />
      <InputBar onSend={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.terminalBg,
  },
  terminal: {
    flex: 1,
  },
});
