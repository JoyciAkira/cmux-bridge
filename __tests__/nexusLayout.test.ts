import { inferPrimaryColumns, trimOpenCodePanePrefix } from '../src/components/terminal/inferPrimaryColumns';
import { buildRenderRow } from '../src/components/terminal/terminalRenderRow';
import { fitTerminalMetrics } from '../src/components/terminal/terminalLayout';
import { computeTerminalViewport } from '../src/components/terminal/terminalViewport';

/** Minimal OpenCode 3-pane sample (chat | chrome at ~col 103 raw, ~98 trimmed). */
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

const TRIMMED = NEXUS_SAMPLE.map(trimOpenCodePanePrefix);

describe('NEXUS-LM OpenCode layout policy', () => {
  it('infers chat boundary in render coords (trimmed plain rows)', () => {
    const primary = inferPrimaryColumns(TRIMMED, 143);
    expect(primary).toBeGreaterThanOrEqual(90);
    expect(primary).toBeLessThan(105);
  });

  it('readable font + chat H-scroll when pane wider than phone', () => {
    const renderRows = NEXUS_SAMPLE.map((r) => buildRenderRow(r));
    const inferred = inferPrimaryColumns(TRIMMED, 143);
    const metrics = fitTerminalMetrics(390, 13);
    expect(metrics.renderFontSize).toBeGreaterThanOrEqual(9);

    const layout = computeTerminalViewport({
      windowWidth: 390,
      cols: 143,
      renderRows,
      plainRows: TRIMMED,
      cursorX: 5,
      metrics,
    });
    expect(layout.primaryColumns).toBe(inferred);
    expect(layout.hasSidebar).toBe(true);
    expect(layout.chatOverflows).toBe(true);
    expect(layout.clipWidth).toBeUndefined();
    expect(layout.primaryWidth).toBeGreaterThan(390);
    expect(layout.renderFontSize).toBeGreaterThanOrEqual(9);
  });

  it('trims OpenCode pane prefix', () => {
    const row = buildRenderRow('  ┃  hello world');
    expect(row.plainText.startsWith('hello')).toBe(true);
    expect(row.runs[0]?.startColumn).toBe(0);
  });
});
