import type { TerminalRenderRow } from './terminalRenderRow';
import { LEFT_INSET, RIGHT_PAD } from './terminalCanvasConstants';
import type { FittedTerminalMetrics } from './terminalLayout';
import { inferPrimaryColumns } from './inferPrimaryColumns';

export interface TerminalViewportLayout extends FittedTerminalMetrics {
  /** Chat pane width in columns (clip boundary from gutter / ┃). */
  primaryColumns: number;
  /** Full row width including optional right sidebar (context, MCP, …). */
  totalColumns: number;
  /** Pixel width of the chat pane content (may exceed windowWidth → H-scroll). */
  primaryWidth: number;
  /** Full canvas width — scroll right past primary to reveal sidebar. */
  fullContentWidth: number;
  /** Pixel clip at chat|sidebar boundary (not at window edge). */
  clipWidth: number;
  hasSidebar: boolean;
}

/** Content extends into the right sidebar column (beyond primary cols). */
export function rowExtendsPastPrimary(row: TerminalRenderRow, primaryColumns: number): boolean {
  if (row.columns > primaryColumns) return true;
  return row.runs.some((run) => run.startColumn + run.columns > primaryColumns);
}

export function maxColumnsPastPrimary(
  renderRows: TerminalRenderRow[],
  primaryColumns: number,
): number {
  let max = primaryColumns;
  for (const row of renderRows) {
    if (!rowExtendsPastPrimary(row, primaryColumns)) continue;
    max = Math.max(max, row.columns);
    for (const run of row.runs) {
      max = Math.max(max, run.startColumn + run.columns);
    }
  }
  return max;
}

/**
 * Deterministic viewport:
 * 1. Infer chat|chrome boundary (`primaryColumns`) from plain screen rows.
 * 2. Keep font metrics as-is (caller must NOT have fitted font to primaryColumns).
 * 3. Chat pixel width = primaryColumns × advance (H-scroll if wider than phone).
 * 4. Sidebar sits past primaryColumns; revealed only when canvas scrolls there.
 */
export function computeTerminalViewport(opts: {
  windowWidth: number;
  cols: number;
  renderRows: TerminalRenderRow[];
  plainRows?: string[];
  /** Sticky inferred primary (avoids gutter flicker between frames). */
  stickyPrimaryColumns?: number;
  cursorX: number;
  metrics: FittedTerminalMetrics;
}): TerminalViewportLayout {
  const relayCols = Math.max(1, opts.cols);
  const plainRows = opts.plainRows ?? opts.renderRows.map((row) => row.plainText);
  const inferredPrimary = opts.stickyPrimaryColumns
    ?? inferPrimaryColumns(plainRows, relayCols);

  const { renderFontSize, cellAdvance, lineHeight, displayColumns } = opts.metrics;

  // primaryColumns = clip boundary only. Never min() with displayColumns —
  // that truncates chat. Font fit is the caller's responsibility separately.
  // No gutter → entire relay surface is the chat pane (H-scroll if needed).
  const primaryColumns = inferredPrimary < relayCols ? inferredPrimary : relayCols;

  const sidebarColumns = Math.max(
    maxColumnsPastPrimary(opts.renderRows, primaryColumns),
    relayCols,
  );
  const hasSidebar = sidebarColumns > primaryColumns || opts.cursorX >= primaryColumns;

  const totalColumns = hasSidebar
    ? Math.max(primaryColumns, sidebarColumns, opts.cursorX + 1)
    : primaryColumns;

  const primaryWidth = LEFT_INSET + primaryColumns * cellAdvance + RIGHT_PAD;
  const fullContentWidth = hasSidebar
    ? LEFT_INSET + totalColumns * cellAdvance + RIGHT_PAD
    : primaryWidth;

  return {
    primaryColumns,
    totalColumns,
    renderFontSize,
    cellAdvance,
    lineHeight,
    displayColumns,
    primaryWidth,
    fullContentWidth,
    clipWidth: Math.ceil(primaryWidth),
    hasSidebar,
  };
}

/** Cursor is in the optional right sidebar (beyond main terminal cols). */
export function cursorInSidebar(cursorX: number, primaryColumns: number): boolean {
  return cursorX >= primaryColumns;
}
