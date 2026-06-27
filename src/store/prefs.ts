import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrefsState {
  scrollbackLines: number;
  terminalFontSize: number;
  reduceMotion: boolean;
  load: () => Promise<void>;
  setScrollback: (n: number) => Promise<void>;
  setFontSize: (n: number) => Promise<void>;
  setReduceMotion: (v: boolean) => Promise<void>;
}

const KEY = 'cmuxbridge:prefs';

const DEFAULTS = {
  scrollbackLines: 500,
  terminalFontSize: 13,
  reduceMotion: false,
};

async function save(patch: Partial<typeof DEFAULTS>): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY);
  const prev = raw ? JSON.parse(raw) : DEFAULTS;
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...prev, ...patch }));
}

export const usePrefsStore = create<PrefsState>((set) => ({
  ...DEFAULTS,

  load: async () => {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) set(JSON.parse(raw));
  },

  setScrollback: async (n) => {
    const clamped = Math.min(2000, Math.max(100, n));
    set({ scrollbackLines: clamped });
    await save({ scrollbackLines: clamped });
  },

  setFontSize: async (n) => {
    const clamped = Math.min(24, Math.max(9, n));
    set({ terminalFontSize: clamped });
    await save({ terminalFontSize: clamped });
  },

  setReduceMotion: async (v) => {
    set({ reduceMotion: v });
    await save({ reduceMotion: v });
  },
}));
