import { useCallback, useMemo } from 'react';
import { estimateCellAdvance } from './terminalMetrics';
import { getTerminalFont, measureCellAdvance } from './terminalFonts';
import { fitTerminalMetrics } from './terminalLayout';

export function useMeasuredCellAdvance(): (fontSize: number) => number {
  return useCallback((fontSize: number) => {
    try {
      const font = getTerminalFont(fontSize, { bold: false, italic: false });
      return measureCellAdvance(font, fontSize);
    } catch {
      return estimateCellAdvance(fontSize);
    }
  }, []);
}

export function useFittedTerminalMetrics(
  windowWidth: number,
  cols: number,
  preferredFontSize: number,
): ReturnType<typeof fitTerminalMetrics> {
  const measureAdvance = useMeasuredCellAdvance();
  return useMemo(
    () => fitTerminalMetrics(windowWidth, cols, preferredFontSize, measureAdvance),
    [windowWidth, cols, preferredFontSize, measureAdvance],
  );
}
