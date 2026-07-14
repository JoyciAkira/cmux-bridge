import { colorizePlainLine } from '../src/components/terminal/heuristicAnsi';
import { inferPrimaryColumns, isTuiViewport } from '../src/components/terminal/inferPrimaryColumns';
import { buildRenderRow } from '../src/components/terminal/terminalRenderRow';
import { computeTerminalViewport } from '../src/components/terminal/terminalViewport';
import { fitTerminalMetrics } from '../src/components/terminal/terminalLayout';
import { attrToCanvasColors } from '../src/components/terminal/ansiTheme';

describe('inferPrimaryColumns', () => {
  it('detects OpenCode MCP gutter around col 103', () => {
    const rows = [
      '  ┃  # Running in ~/GITHUB_REPOS/NEXUS-LM                                               $200.28 spent                        ',
      '  ┃  $ python3 - <<\'PY\'                                                                                ▼ MCP                                ',
      '  ┃      if d!=e[\'sha256\']: errs.append(f\'mismatch {p}\')                                               • MCP_DOCKER MCP error -32000:       ',
      '  ┃  print(\'achl1_manifest_sha256\', hashlib.sha256(man.read_bytes()).hexdigest())                      • memento MCP error -32000:          ',
      '  ┃  short left only                                                                                                                     ',
      '  ┃  another left row                                                                                                                    ',
      '  ┃  body text without chrome                                                                                                            ',
      '  ┃  more body                                                                                                                           ',
      '  ┃  still body                                                                                                                          ',
      '  ┃  padding row                                                                                                                         ',
    ].map((r) => r.padEnd(143, ' '));

    const primary = inferPrimaryColumns(rows, 143);
    expect(primary).toBeGreaterThanOrEqual(100);
    expect(primary).toBeLessThanOrEqual(110);
  });

  it('keeps full width when no chrome gutter', () => {
    const rows = [
      'hello world',
      'second line',
      'third line here',
    ];
    expect(inferPrimaryColumns(rows, 80)).toBe(80);
  });
});

describe('heuristicAnsi', () => {
  it('does not double-wrap lines that already have ANSI', () => {
    const raw = '\x1b[31mFAIL\x1b[0m';
    expect(colorizePlainLine(raw)).toBe(raw);
  });

  it('colors PASS/FAIL tokens', () => {
    const out = colorizePlainLine('G9_SOURCE_MATRIX_PARITY = FAIL');
    expect(out).toContain('\x1b[');
    expect(out).toContain('FAIL');
    const row = buildRenderRow(out);
    const failRun = row.runs.find((r) => r.text.includes('FAIL'));
    expect(failRun).toBeTruthy();
    const { fg } = attrToCanvasColors(failRun!.attr);
    expect(fg.toLowerCase()).not.toBe('#cccccc');
  });

  it('colors MCP label', () => {
    const out = colorizePlainLine('something          MCP');
    expect(out).toContain('\x1b[35mMCP');
  });
});

describe('viewport with inferred primary', () => {
  it('marks hasSidebar when chrome sits inside relay cols', () => {
    const rows = [
      buildRenderRow(('left chat content here').padEnd(103, ' ') + 'MCP'.padEnd(40, ' ')),
      buildRenderRow(('more chat content xx').padEnd(103, ' ') + '$12.00 spent'.padEnd(40, ' ')),
      buildRenderRow(('another left column').padEnd(103, ' ') + '▼ MCP'.padEnd(40, ' ')),
      buildRenderRow(('body of the agent').padEnd(103, ' ') + 'agents'.padEnd(40, ' ')),
      buildRenderRow(('continued output !!').padEnd(103, ' ') + 'x'.padEnd(40, ' ')),
      buildRenderRow(('still going left ok').padEnd(103, ' ') + 'y'.padEnd(40, ' ')),
      buildRenderRow(('row with enough gap').padEnd(103, ' ') + 'z'.padEnd(40, ' ')),
      buildRenderRow(('detectable chrome !!').padEnd(103, ' ') + 'w'.padEnd(40, ' ')),
      buildRenderRow(('ninth sample row !!').padEnd(103, ' ') + 'v'.padEnd(40, ' ')),
      buildRenderRow(('tenth sample row !!').padEnd(103, ' ') + 'u'.padEnd(40, ' ')),
    ];
    const metrics = fitTerminalMetrics(390, 13);
    const layout = computeTerminalViewport({
      windowWidth: 390,
      cols: 143,
      renderRows: rows,
      cursorX: 5,
      metrics,
    });
    expect(layout.primaryColumns).toBeGreaterThanOrEqual(95);
    expect(layout.primaryColumns).toBeLessThan(120);
    expect(layout.hasSidebar).toBe(true);
    expect(layout.renderFontSize).toBeGreaterThanOrEqual(9);
    expect(layout.primaryWidth).toBe(390);
    expect(layout.primaryWidth).toBe(390);
  });
});

describe('isTuiViewport', () => {
  it('detects OpenCode divider layout', () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      i > 5 ? '  ┃  chat line here' : 'agent output without divider',
    );
    expect(isTuiViewport(rows, 143)).toBe(true);
  });

  it('does not flag plain shell scrollback', () => {
    const rows = Array.from({ length: 200 }, (_, i) => `line ${i} output here`);
    expect(isTuiViewport(rows, 80)).toBe(false);
  });
});
