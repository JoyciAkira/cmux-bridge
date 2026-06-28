import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getRelayClient,
  RelayStatus,
  Workspace,
  Surface,
  PushFrame,
  ScreenFull,
  ScreenDiff,
  RelayClient,
} from '../services/relay';
import { useTerminalStore } from '../store/terminal';

export interface WorkspaceWithSurfaces extends Workspace {
  surfaces: Surface[];
}

export function useRelay(macId: string, host: string, port = 4399) {
  const [status, setStatus] = useState<RelayStatus>('disconnected');
  const [workspaces, setWorkspaces] = useState<WorkspaceWithSurfaces[]>([]);
  const clientRef = useRef<RelayClient>(getRelayClient(macId));
  const setScreen = useTerminalStore((s) => s.setScreen);
  const applyDiff = useTerminalStore((s) => s.applyDiff);

  const loadWorkspaces = useCallback(async (client: RelayClient) => {
    try {
      const ws = await client.listWorkspaces();
      const withSurfaces = await Promise.all(
        ws.map(async (w) => {
          const surfaces = await client.listSurfaces(w.id);
          return { ...w, surfaces };
        }),
      );
      setWorkspaces(withSurfaces);
    } catch { /* retry on reconnect */ }
  }, []);

  useEffect(() => {
    const client = clientRef.current;

    const onStatus = (s: RelayStatus) => {
      setStatus(s);
      if (s === 'connected') loadWorkspaces(client);
    };

    const onPush = (frame: PushFrame) => {
      if (frame.type === 'screen.full') {
        const f = frame as ScreenFull;
        setScreen(f.surface_id, f.rows, f.cols, f.cursor);
      } else if (frame.type === 'screen.diff') {
        const f = frame as ScreenDiff;
        applyDiff(f.surface_id, f.ops as Array<{ op: string; y?: number; x?: number; text?: string }>);
      }
    };

    client.on('status', onStatus);
    client.on('push', onPush);
    if (host) client.connect(host, port);

    return () => {
      client.off('status', onStatus);
      client.off('push', onPush);
    };
  }, [macId, host, port, loadWorkspaces, setScreen, applyDiff]);

  const subscribe = useCallback((workspaceId: string, surfaceId: string) => {
    clientRef.current.subscribe(workspaceId, surfaceId).catch(() => {});
  }, []);

  const unsubscribe = useCallback((_workspaceId: string, surfaceId: string) => {
    clientRef.current.unsubscribe(surfaceId).catch(() => {});
  }, []);

  const sendInput = useCallback((surfaceId: string, text: string) => {
    clientRef.current.sendInput(surfaceId, text).catch(() => {});
  }, []);

  const refresh = useCallback(() => {
    loadWorkspaces(clientRef.current);
  }, [loadWorkspaces]);

  return { status, workspaces, subscribe, unsubscribe, sendInput, refresh };
}
