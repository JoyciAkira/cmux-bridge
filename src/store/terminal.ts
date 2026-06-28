import { create } from 'zustand';

export interface TerminalLine {
  id: number;
  text: string;         // raw ANSI string for the line
}

interface SurfaceState {
  lines: TerminalLine[];
  nextId: number;
  fontSize: number;
}

interface TerminalState {
  surfaces: Record<string, SurfaceState>;   // key: surfaceId
  appendOutput: (key: string, raw: string, maxLines?: number) => void;
  setScreen: (key: string, rows: string[], cols: number, cursor: { x: number; y: number }) => void;
  applyDiff: (key: string, ops: Array<{ op: string; y?: number; x?: number; text?: string }>) => void;
  clearSurface: (key: string) => void;
  clearAllSurfaces: () => void;
  setFontSize: (key: string, size: number) => void;
  getSurface: (key: string) => SurfaceState;
}

// Default; overridden at call site by usePrefsStore().scrollbackLines
const MAX_LINES = 500;

const defaultSurface = (): SurfaceState => ({ lines: [], nextId: 0, fontSize: 13 });

export const useTerminalStore = create<TerminalState>((set, get) => ({
  surfaces: {},

  getSurface: (key) => get().surfaces[key] ?? defaultSurface(),

  setScreen: (key, rows, _cols, _cursor) => {
    set((state) => {
      const prev = state.surfaces[key] ?? defaultSurface();
      const lines = rows.map((text, i) => ({ id: i, text }));
      return { surfaces: { ...state.surfaces, [key]: { ...prev, lines, nextId: rows.length } } };
    });
  },

  applyDiff: (key, ops) => {
    set((state) => {
      const prev = state.surfaces[key] ?? defaultSurface();
      const lines = [...prev.lines];
      let nextId = prev.nextId;
      let changed = false;
      for (const op of ops) {
        if (op.op === 'clear') {
          if (lines.length > 0) { lines.length = 0; nextId = 0; changed = true; }
        } else if (op.op === 'row' && op.y !== undefined) {
          while (lines.length <= op.y) { lines.push({ id: nextId++, text: '' }); changed = true; }
          const newText = op.text ?? '';
          if (lines[op.y].text !== newText) {
            lines[op.y] = { id: lines[op.y].id, text: newText };
            changed = true;
          }
        }
      }
      if (!changed) return state;
      return { surfaces: { ...state.surfaces, [key]: { ...prev, lines: [...lines], nextId } } };
    });
  },

  appendOutput: (key, raw, maxLines = MAX_LINES) => {
    set((state) => {
      const prev = state.surfaces[key] ?? defaultSurface();
      // Split incoming data on newlines, appending to the last partial line
      const incoming = raw.split('\n');
      const lines = [...prev.lines];
      let nextId = prev.nextId;

      if (lines.length > 0 && incoming.length > 0) {
        // Append first chunk to the last line
        lines[lines.length - 1] = {
          ...lines[lines.length - 1],
          text: lines[lines.length - 1].text + incoming[0],
        };
        for (let i = 1; i < incoming.length; i++) {
          lines.push({ id: nextId++, text: incoming[i] });
        }
      } else {
        for (const chunk of incoming) {
          lines.push({ id: nextId++, text: chunk });
        }
      }

      const trimmed = lines.length > maxLines ? lines.slice(lines.length - maxLines) : lines;
      return {
        surfaces: {
          ...state.surfaces,
          [key]: { ...prev, lines: trimmed, nextId },
        },
      };
    });
  },

  clearSurface: (key) => {
    set((state) => ({
      surfaces: { ...state.surfaces, [key]: defaultSurface() },
    }));
  },

  clearAllSurfaces: () => set({ surfaces: {} }),

  setFontSize: (key, size) => {
    set((state) => {
      const prev = state.surfaces[key] ?? defaultSurface();
      return {
        surfaces: { ...state.surfaces, [key]: { ...prev, fontSize: size } },
      };
    });
  },
}));
