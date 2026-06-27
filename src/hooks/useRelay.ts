import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getRelayClient,
  RelayStatus,
  WorkspaceItem,
  RelayMessage,
} from '../services/relay';
import { useTerminalStore } from '../store/terminal';
import { usePrefsStore } from '../store/prefs';

export function useRelay(macId: string, host: string, port = 4399) {
  const [status, setStatus] = useState<RelayStatus>('disconnected');
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const appendOutput = useTerminalStore((s) => s.appendOutput);
  const scrollbackLines = usePrefsStore((s) => s.scrollbackLines);
  const clientRef = useRef(getRelayClient(macId));

  useEffect(() => {
    const client = clientRef.current;

    const onStatus = (s: RelayStatus) => setStatus(s);

    const onMessage = (msg: RelayMessage) => {
      switch (msg.type) {
        case 'workspaces':
          setWorkspaces(msg.items);
          break;
        case 'output': {
          const key = `${msg.workspaceId}:${msg.surfaceId}`;
          const decoded = atob(msg.data);
          appendOutput(key, decoded, scrollbackLines);
          break;
        }
        case 'ack':
          client.list();
          break;
        case 'error':
          // relay reported an error — status stays connected, surface may be broken
          break;
        case 'event':
          // handled by notifications service — nothing to do in UI layer
          break;
        default: {
          // exhaustiveness: if relay adds a new type, this catches it at compile time
          const _exhaustive: never = msg;
          void _exhaustive;
        }
      }
    };

    client.on('status', onStatus);
    client.on('message', onMessage);
    client.connect(host, port);

    return () => {
      client.off('status', onStatus);
      client.off('message', onMessage);
      // Do NOT disconnect here — connection survives navigation
    };
  }, [macId, host, port, appendOutput]);

  const subscribe = useCallback(
    (workspaceId: string, surfaceId: string) => {
      clientRef.current.subscribe(workspaceId, surfaceId);
    },
    [],
  );

  const unsubscribe = useCallback(
    (workspaceId: string, surfaceId: string) => {
      clientRef.current.unsubscribe(workspaceId, surfaceId);
    },
    [],
  );

  const sendInput = useCallback((data: string) => {
    // btoa encodes arbitrary string to base64
    clientRef.current.sendInput(btoa(data));
  }, []);

  const refresh = useCallback(() => {
    clientRef.current.list();
  }, []);

  return { status, workspaces, subscribe, unsubscribe, sendInput, refresh };
}
