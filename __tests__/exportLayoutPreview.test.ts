import { trimOpenCodePanePrefix } from '../src/components/terminal/inferPrimaryColumns';
import { buildRenderRow } from '../src/components/terminal/terminalRenderRow';
import { fitTerminalMetrics } from '../src/components/terminal/terminalLayout';
import { computeTerminalViewport } from '../src/components/terminal/terminalViewport';
import * as fs from 'fs';
import * as path from 'path';

const SAMPLE = [
  '  ┃         production worktree. Integrate minimal H3 executable observer path from main after                                    ',
  '  ┃         worktree creation if missing. Do not start from main because it lacks ACHL scoped          • playwright Connected     ',
  '  ┃         contracts.                                                                                 • websearch Connected      ',
  '  ┃    55 + ## Next Steps                                                                              LSP                        ',
  '   ⬝⬝⬝⬝⬝⬝⬝⬝  esc interrupt                                   80.5K (40%) · $200.28  ctrl+p commands    • OpenCode 1.17.20         ',
].map((r) => r.padEnd(143, ' '));

describe('exportLayoutPreview', () => {
  it('writes scripts/layout-preview.json for browser harness', () => {
    const trimmed = SAMPLE.map(trimOpenCodePanePrefix);
    const renderRows = SAMPLE.map((r) => buildRenderRow(r));
    const metrics = fitTerminalMetrics(390, 13);
    const layout = computeTerminalViewport({
      windowWidth: 390,
      cols: 143,
      renderRows,
      plainRows: trimmed,
      cursorX: 5,
      metrics,
    });
    const rows = renderRows.map((row, i) => ({
      i,
      plain: row.plainText,
      runs: row.runs.map((run) => ({
        text: run.text,
        start: run.startColumn,
        cols: run.columns,
      })),
    }));
    const out = path.join(__dirname, '..', 'scripts', 'layout-preview.json');
    fs.writeFileSync(out, JSON.stringify({ layout, metrics, rows }, null, 2));
    expect(layout.renderFontSize).toBeGreaterThanOrEqual(9);
    expect(layout.chatOverflows).toBe(true);
  });
});
