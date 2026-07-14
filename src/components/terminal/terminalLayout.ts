import { LEFT_INSET, RIGHT_PAD } from './terminalCanvasConstants';
import { estimateCellAdvance } from './terminalMetrics';

export interface FittedTerminalMetrics {
  renderFontSize: number;
  cellAdvance: number;
  lineHeight: number;
  /** Columns that fit on screen at the chosen font. */
  displayColumns: number;
}

const ADVANCE_SAFETY = 1.06;
const MIN_FONT_SIZE = 9;

/** Phone font metrics — never shrink to fit relay cols or primaryColumns. */
export function fitTerminalMetrics(
  windowWidth: number,
  preferredFontSize: number,
  measureAdvance: (fontSize: number) => number = estimateCellAdvance,
): FittedTerminalMetrics {
  const usable = Math.max(1, windowWidth - LEFT_INSET - RIGHT_PAD);
  let renderFontSize = Math.min(24, Math.max(MIN_FONT_SIZE, Math.round(preferredFontSize)));
  let cellAdvance = measureAdvance(renderFontSize);

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
