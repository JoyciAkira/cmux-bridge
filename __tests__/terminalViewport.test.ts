import { buildRenderRow } from '../src/components/terminal/terminalRenderRow';
import { fitTerminalMetrics } from '../src/components/terminal/terminalLayout';
import { computeTerminalViewport, rowExtendsPastPrimary } from '../src/components/terminal/terminalViewport';
import { attrToCanvasColors } from '../src/components/terminal/ansiTheme';
import { parseAnsiLine } from '../src/components/terminal/ansiParser';

describe('terminalViewport', () => {
  const rows = [
    buildRenderRow('chat line'),
    buildRenderRow('sidebar'.padStart(100, ' ')),
  ];

  it('fits primary cols to screen width', () => {
    const metrics = fitTerminalMetrics(390, 13);
    const layout = computeTerminalViewport({
      windowWidth: 390,
      cols: 80,
      renderRows: rows,
      cursorX: 5,
      metrics,
    });
    expect(layout.primaryColumns).toBe(80);
    expect(layout.hasSidebar).toBe(true);
    expect(layout.fullContentWidth).toBeGreaterThan(layout.primaryWidth);
    expect(layout.renderFontSize).toBeGreaterThanOrEqual(9);
    expect(layout.primaryWidth).toBe(390);
  });

  it('does not treat in-bounds long chat as sidebar', () => {
    const chatOnly = [buildRenderRow('short'), buildRenderRow('x'.repeat(79))];
    expect(rowExtendsPastPrimary(chatOnly[1], 80)).toBe(false);
    const metrics = fitTerminalMetrics(390, 13);
    const layout = computeTerminalViewport({
      windowWidth: 390,
      cols: 80,
      renderRows: chatOnly,
      cursorX: 2,
      metrics,
    });
    expect(layout.hasSidebar).toBe(false);
    expect(layout.fullContentWidth).toBe(layout.primaryWidth);
    expect(layout.totalColumns).toBe(80);
  });

  it('detects sidebar cursor', () => {
    const metrics = fitTerminalMetrics(390, 13);
    const layout = computeTerminalViewport({
      windowWidth: 390,
      cols: 80,
      renderRows: rows,
      cursorX: 95,
      metrics,
    });
    expect(layout.hasSidebar).toBe(true);
    expect(layout.totalColumns).toBeGreaterThan(layout.primaryColumns);
  });
});

describe('ansi canvas colors', () => {
  it('emits hex colors for Skia', () => {
    const cells = parseAnsiLine('\x1b[38;5;196mx\x1b[0m');
    const { fg } = attrToCanvasColors(cells[0].attr);
    expect(fg).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('emits hex for truecolor', () => {
    const cells = parseAnsiLine('\x1b[38;2;255;128;0morange\x1b[0m');
    const { fg } = attrToCanvasColors(cells[0].attr);
    expect(fg).toBe('#ff8000');
  });
});
