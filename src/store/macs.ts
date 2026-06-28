import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { destroyRelayClient } from '../services/relay';
import { useTerminalStore } from './terminal';

export interface MacConnection {
  id: string;           // uuid
  label: string;
  host: string;         // Tailscale IP
  port: number;         // default 4399
  addedAt: number;      // unix ms
}

interface MacsState {
  macs: MacConnection[];
  load: () => Promise<void>;
  add: (conn: Omit<MacConnection, 'id' | 'addedAt'>) => Promise<MacConnection>;
  remove: (id: string) => Promise<void>;
  update: (id: string, patch: Partial<Pick<MacConnection, 'label' | 'host' | 'port'>>) => Promise<void>;
}

const STORE_KEY = 'cmuxbridge_macs';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function persist(macs: MacConnection[]): Promise<void> {
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(macs));
}

export const useMacsStore = create<MacsState>((set, get) => ({
  macs: [],

  load: async () => {
    const raw = await SecureStore.getItemAsync(STORE_KEY);
    if (raw) {
      set({ macs: JSON.parse(raw) as MacConnection[] });
    }
  },

  add: async (conn) => {
    const entry: MacConnection = { ...conn, id: uuid(), addedAt: Date.now() };
    const macs = [...get().macs, entry];
    set({ macs });
    await persist(macs);
    return entry;
  },

  remove: async (id) => {
    destroyRelayClient(id);
    useTerminalStore.getState().clearAllSurfaces();
    const macs = get().macs.filter((m) => m.id !== id);
    set({ macs });
    await persist(macs);
  },

  update: async (id, patch) => {
    const macs = get().macs.map((m) => (m.id === id ? { ...m, ...patch } : m));
    set({ macs });
    await persist(macs);
  },
}));
