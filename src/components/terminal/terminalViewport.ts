import type { TerminalRenderRow } from './terminalRenderRow';
import { LEFT_INSET, RIGHT_PAD } from './terminalCanvasConstants';
import type { FittedTerminalMetrics } from './terminalLayout';
import { inferPrimaryColumns } from './inferPrimaryColumns';

export interface TerminalViewportLayout extends FittedTerminalMetrics {
  /** Chat pane width in columns (clip boundary from gutter / ┃, render coords). */
  primaryColumns: number;
  /** Full row width including optional right sidebar (context, MCP, …). */
  totalColumns: number;
  /** Pixel width of the chat pane content (may exceed windowWidth → H-scroll). */
  primaryWidth: number;
  /** Full canvas width — scroll right past primaryColumns to reveal sidebar. */
  fullContentWidth: number;
  /** Pixel clip at the phone viewport edge (undefined when chat H-scrolls). */
  clipWidth: number | undefined;
  /** Chat pane is wider than the phone — pan horizontally within chat. */
  chatOverflows: boolean;
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
 * 1. `plainRows` must be trim-aligned with `buildRenderRow` (pane prefix removed).
 * 2. `primaryColumns` = inferred chat|chrome boundary — column clip only.
 * 3. Font metrics come from `fitTerminalMetrics` (phone budget, not primaryColumns).
 * 4. Chat wider than phone → `chatOverflows` + horizontal pan within chat.
 */
export function computeTerminalViewport(opts: {
  windowWidth: number;
  cols: number;
  renderRows: TerminalRenderRow[];
  plainRows?: string[];
  stickyPrimaryColumns?: number;
  cursorX: number;
  metrics: FittedTerminalMetrics;
}): TerminalViewportLayout {
  const relayCols = Math.max(1, opts.cols);
  const plainRows = opts.plainRows ?? opts.renderRows.map((row) => row.plainText);
  const inferredPrimary = opts.stickyPrimaryColumns
    ?? inferPrimaryColumns(plainRows, relayCols);

  const { renderFontSize, cellAdvance, lineHeight, displayColumns } = opts.metrics;

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

  const chatOverflows = primaryWidth > opts.windowWidth + 0.5;

  return {
    primaryColumns,
    totalColumns,
    renderFontSize,
    cellAdvance,
    lineHeight,
    displayColumns,
    primaryWidth,
    fullContentWidth,
    clipWidth: chatOverflows ? undefined : Math.ceil(Math.min(opts.windowWidth, primaryWidth)),
    chatOverflows,
    hasSidebar,
  };
}

/** Cursor is in the optional right sidebar (beyond main terminal cols). */
export function cursorInSidebar(cursorX: number, primaryColumns: number): boolean {
  return cursorX >= primaryColumns;
}
