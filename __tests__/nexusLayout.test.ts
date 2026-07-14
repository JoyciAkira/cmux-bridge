import { inferPrimaryColumns } from '../src/components/terminal/inferPrimaryColumns';
import { buildRenderRow } from '../src/components/terminal/terminalRenderRow';
import { fitTerminalMetrics } from '../src/components/terminal/terminalLayout';
import { computeTerminalViewport } from '../src/components/terminal/terminalViewport';

/** Minimal OpenCode 3-pane sample (chat | chrome at ~col 103). */
const NEXUS_SAMPLE = [
  '  ┃         production worktree. Integrate minimal H3 executable observer path from main after                                    ',
  '  ┃         worktree creation if missing. Do not start from main because it lacks ACHL scoped          • playwright Connected     ',
  '  ┃         contracts.                                                                                 • websearch Connected      ',
  '  ┃    54 +                                                                                                                       ',
  '  ┃    55 + ## Next Steps                                                                              LSP                        ',
  '  ┃    56 +                                                                                            LSPs are disabled          ',
  '  ┃    57 + 1. Ask Plan Agent to review this base strategy and Phase A audit path.                                                ',
  '  ┃    58 + 2. Create worktree `/Users/danielecorrao/GITHUB_REPOS/NEXUS-LM-production-learning/        ▼ Todo                     ',
  '  ┃    59 + 3. Write `docs/research/NEXUS_PRODUCTION_REAL_LEARNING_V1_INTEGRATION_AUDIT.md` in             GITHUB_REPOS/NEXUS-LM: ',
  '  ┃         production worktree.                                                                           integration-base git au',
  '     Phase A audit state saved. Next, Plan Agent reviews base strategy before worktree edits.              Record Phase A findings',
  '  ┃  # Todos                                                                                           [•] Plan Agent: Review prod',
  '  ┃  [✓] /Users/danielecorrao/GITHUB_REPOS/NEXUS-LM: Run integration-base git audit for                    edits - expect phased e',
  '  ┃  [•] Plan Agent: Review production RL implementation strategy before edits - expect phased             executable plan         ',
  '  ┃  Sisyphus - Ultraworker · [DLab] GPT-5.5 DLab                                                      confirmation               ',
  '   ⬝⬝⬝⬝⬝⬝⬝⬝  esc interrupt                                   80.5K (40%) · $200.28  ctrl+p commands    • OpenCode 1.17.20         ',
].map((r) => r.padEnd(143, ' '));

describe('NEXUS-LM OpenCode layout policy', () => {
  it('infers chat boundary near col 103', () => {
    const primary = inferPrimaryColumns(NEXUS_SAMPLE, 143);
    expect(primary).toBeGreaterThanOrEqual(100);
    expect(primary).toBeLessThan(110);
  });

  it('keeps preferred font — primaryColumns is clip only, not fit target', () => {
    const renderRows = NEXUS_SAMPLE.map((r) => buildRenderRow(r));
    const inferred = inferPrimaryColumns(NEXUS_SAMPLE, 143);
    // softFitCols=1 → no shrink-to-fit (same as TerminalView)
    const metrics = fitTerminalMetrics(390, 1, 13);
    expect(metrics.renderFontSize).toBe(13);

    const layout = computeTerminalViewport({
      windowWidth: 390,
      cols: 143,
      renderRows,
      plainRows: NEXUS_SAMPLE,
      cursorX: 5,
      metrics,
    });
    expect(layout.primaryColumns).toBe(inferred);
    expect(layout.primaryColumns).toBeGreaterThanOrEqual(100);
    expect(layout.hasSidebar).toBe(true);
    expect(layout.renderFontSize).toBe(13);
    // Chat may be wider than the phone — H-scroll, not font shrink.
    expect(layout.primaryWidth).toBeGreaterThan(390);
    expect(layout.clipWidth).toBe(Math.ceil(layout.primaryWidth));
    expect(layout.fullContentWidth).toBeGreaterThan(layout.primaryWidth);
  });

  it('trims OpenCode pane prefix', () => {
    const row = buildRenderRow('  ┃  hello world');
    expect(row.plainText.startsWith('hello')).toBe(true);
    expect(row.runs[0]?.startColumn).toBe(0);
  });
});
