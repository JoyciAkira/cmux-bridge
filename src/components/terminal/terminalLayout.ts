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
const MIN_FONT_SIZE = 9;
/** Soft-fit budget: columns we try to fit without shrinking below MIN_FONT_SIZE. */
const PHONE_SOFT_FIT_COLS = 48;

/**
 * Phone font metrics at the preferred size.
 *
 * Never pass relay `cols` (~143) or inferred `primaryColumns` (~98) here — that
 * shrinks text to illegible sizes. We only soft-fit to ~48 phone columns.
 */
export function fitTerminalMetrics(
  windowWidth: number,
  preferredFontSize: number,
  measureAdvance: (fontSize: number) => number = estimateCellAdvance,
): FittedTerminalMetrics {
  const usable = Math.max(1, windowWidth - LEFT_INSET - RIGHT_PAD);
  let renderFontSize = Math.min(24, Math.max(MIN_FONT_SIZE, Math.round(preferredFontSize)));
  let cellAdvance = measureAdvance(renderFontSize);

  while (
    PHONE_SOFT_FIT_COLS * cellAdvance > usable + 0.5
    && renderFontSize > MIN_FONT_SIZE
  ) {
    renderFontSize -= 1;
    cellAdvance = measureAdvance(renderFontSize);
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
