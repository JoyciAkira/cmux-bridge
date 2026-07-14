import { inferPrimaryColumns, trimOpenCodePanePrefix } from '../src/components/terminal/inferPrimaryColumns';
import { buildRenderRow } from '../src/components/terminal/terminalRenderRow';
import { fitTerminalMetrics } from '../src/components/terminal/terminalLayout';
import { computeTerminalViewport } from '../src/components/terminal/terminalViewport';

const NEXUS_SAMPLE = [
  '  ┃         production worktree. Integrate minimal H3 executable observer path from main after                                    ',
  '  ┃         worktree creation if missing. Do not start from main because it lacks ACHL scoped          • playwright Connected     ',
  '  ┃         contracts.                                                                                 • websearch Connected      ',
  '  ┃    55 + ## Next Steps                                                                              LSP                        ',
  '   ⬝⬝⬝⬝⬝⬝⬝⬝  esc interrupt                                   80.5K (40%) · $200.28  ctrl+p commands    • OpenCode 1.17.20         ',
].map((r) => r.padEnd(143, ' '));

const TRIMMED = NEXUS_SAMPLE.map(trimOpenCodePanePrefix);

describe('NEXUS-LM OpenCode layout policy', () => {
  it('infers chat boundary in render coords (trimmed plain rows)', () => {
    const primary = inferPrimaryColumns(TRIMMED, 143);
    expect(primary).toBeGreaterThanOrEqual(90);
    expect(primary).toBeLessThan(105);
  });

  it('readable font, window-width canvas, column clip hides sidebar', () => {
    const renderRows = NEXUS_SAMPLE.map((r) => buildRenderRow(r));
    const metrics = fitTerminalMetrics(390, 13);
    expect(metrics.renderFontSize).toBe(13);

    const layout = computeTerminalViewport({
      windowWidth: 390,
      cols: 143,
      renderRows,
      plainRows: TRIMMED,
      cursorX: 5,
      metrics,
    });
    expect(layout.primaryColumns).toBeGreaterThanOrEqual(90);
    expect(layout.hasSidebar).toBe(true);
    expect(layout.primaryWidth).toBe(390);
    expect(layout.clipWidth).toBe(390);
    expect(layout.renderFontSize).toBe(13);
    expect(layout.displayColumns).toBeGreaterThan(40);
  });

  it('trims OpenCode pane prefix', () => {
    const row = buildRenderRow('  ┃  hello world');
    expect(row.plainText.startsWith('hello')).toBe(true);
    expect(row.runs[0]?.startColumn).toBe(0);
  });
});
