import type { TerminalRenderRow } from './terminalRenderRow';
import { LEFT_INSET, RIGHT_PAD } from './terminalCanvasConstants';
import type { FittedTerminalMetrics } from './terminalLayout';
import { inferPrimaryColumns } from './inferPrimaryColumns';

export interface TerminalViewportLayout extends FittedTerminalMetrics {
  /** Chat pane column clip (render coords, trimmed plain rows). */
  primaryColumns: number;
  totalColumns: number;
  /** Always the phone viewport width when chat-only. */
  primaryWidth: number;
  fullContentWidth: number;
  clipWidth: number;
  hasSidebar: boolean;
}

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
 * Viewport for phone:
 * - `plainRows` = trimmed (same coords as buildRenderRow).
 * - `primaryColumns` clips sidebar chrome; canvas width stays `windowWidth`.
 * - Font is NOT shrunk to primaryColumns — long chat lines clip at screen edge.
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

  const primaryWidth = opts.windowWidth;
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
    clipWidth: opts.windowWidth,
    hasSidebar,
  };
}

export function cursorInSidebar(cursorX: number, primaryColumns: number): boolean {
  return cursorX >= primaryColumns;
}
