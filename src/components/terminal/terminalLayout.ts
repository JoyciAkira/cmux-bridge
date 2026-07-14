import { LEFT_INSET, RIGHT_PAD } from './terminalCanvasConstants';
import { estimateCellAdvance } from './terminalMetrics';

export interface FittedTerminalMetrics {
  renderFontSize: number;
  cellAdvance: number;
  lineHeight: number;
  /** Columns that fit on screen at the chosen font (viewport budget). */
  displayColumns: number;
}

const ADVANCE_SAFETY = 1.06;
/** Never shrink below this — primaryColumns is a clip boundary, not a fit target. */
const MIN_FONT_SIZE = 9;

/**
 * Metrics at the preferred font size.
 *
 * `softFitCols` is an optional soft budget: we may shrink slightly so that many
 * columns fit, but never below MIN_FONT_SIZE. Do NOT pass OpenCode
 * `primaryColumns` (~103) or relay `cols` (~143) here — that forces unreadably
 * small text. Pass a phone-scale budget (e.g. displayColumns from a prior pass)
 * or omit soft-fit entirely (softFitCols <= 0 / 1).
 */
export function fitTerminalMetrics(
  windowWidth: number,
  softFitCols: number,
  preferredFontSize: number,
  measureAdvance: (fontSize: number) => number = estimateCellAdvance,
): FittedTerminalMetrics {
  const usable = Math.max(1, windowWidth - LEFT_INSET - RIGHT_PAD);
  let renderFontSize = Math.min(24, Math.max(MIN_FONT_SIZE, Math.round(preferredFontSize)));
  let cellAdvance = measureAdvance(renderFontSize);

  const targetCols = Math.max(0, softFitCols);
  if (targetCols > 1) {
    while (targetCols * cellAdvance > usable + 0.5 && renderFontSize > MIN_FONT_SIZE) {
      renderFontSize -= 1;
      cellAdvance = measureAdvance(renderFontSize);
    }
  }

  const safeAdvance = cellAdvance * ADVANCE_SAFETY;
  let displayColumns = Math.max(1, Math.floor(usable / safeAdvance));
  while (displayColumns * safeAdvance > usable + 0.5 && displayColumns > 16) {
    displayColumns -= 1;
  }

  return {
    renderFontSize,
    cellAdvance,
    lineHeight: renderFontSize + 2,
    displayColumns,
  };
}
