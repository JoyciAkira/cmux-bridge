/**
 * Infer chat primary width from the right-side chrome gutter.
 *
 * OpenCode / Claude Code paint MCP / spend / agents in a right column after a
 * long run of spaces, or use box-drawing dividers (┃) for multi-pane layouts.
 * cmux reports the full terminal width as `cols`, so without this heuristic
 * the phone fits all columns and crams chrome against the edge.
 */

const MIN_GAP = 6;
const MIN_ROWS = 3;
const DIVIDER_CHARS = new Set(['\u2503', '\u2502', '\u2551']);

function voteBoxDividerColumns(plainRows: string[], relayCols: number): Map<number, number> {
  const votes = new Map<number, number>();
  const minCol = Math.max(16, Math.floor(relayCols * 0.12));

  for (const row of plainRows) {
    const text = row.length > relayCols ? row.slice(0, relayCols) : row;
    for (let i = 0; i < text.length; i++) {
      if (!DIVIDER_CHARS.has(text[i])) continue;
      if (i < minCol) continue;
      votes.set(i, (votes.get(i) ?? 0) + 1);
    }
  }
  return votes;
}

export function inferPrimaryColumns(plainRows: string[], relayCols: number): number {
  const cols = Math.max(1, relayCols);
  if (plainRows.length < MIN_ROWS) return cols;

  const votes = new Map<number, number>();
  const rightThreshold = Math.floor(cols * 0.45);

  for (const row of plainRows) {
    const text = row.length > cols ? row.slice(0, cols) : row;
    let i = 0;
    while (i < text.length) {
      if (text[i] !== ' ') {
        i += 1;
        continue;
      }
      const gapStart = i;
      while (i < text.length && text[i] === ' ') i += 1;
      const gapEnd = i;
      if (
        gapEnd - gapStart >= MIN_GAP
        && gapEnd > rightThreshold
        && gapEnd < text.length
        && gapStart >= 16
      ) {
        votes.set(gapEnd, (votes.get(gapEnd) ?? 0) + 1);
      }
    }
  }

  const dividerVotes = voteBoxDividerColumns(plainRows, cols);
  const minDividerVotes = Math.max(3, Math.floor(plainRows.length * 0.08));
  for (const [col, count] of dividerVotes) {
    if (count >= minDividerVotes) {
      votes.set(col, (votes.get(col) ?? 0) + count);
    }
  }

  if (votes.size === 0) return cols;

  // Cluster nearby gap-end votes (±2) — chrome column jitters by a cell or two.
  const clustered = new Map<number, number>();
  for (const [col, count] of votes) {
    let anchor = col;
    for (const existing of clustered.keys()) {
      if (Math.abs(existing - col) <= 2) {
        anchor = existing;
        break;
      }
    }
    clustered.set(anchor, (clustered.get(anchor) ?? 0) + count);
  }

  const minVotes = Math.max(3, Math.floor(plainRows.length * 0.1));
  let bestCol = cols;
  let bestVotes = 0;
  for (const [col, count] of clustered) {
    if (count < minVotes) continue;
    // Prefer the leftmost strong gutter (chat | chrome), not the far-right edge.
    if (count > bestVotes || (count === bestVotes && col < bestCol)) {
      bestVotes = count;
      bestCol = col;
    }
  }

  if (bestCol >= cols || bestCol < 24) return cols;
  return bestCol;
}

/** Trim OpenCode left pane prefix (`  ┃  `) for denser mobile layout. */
export function trimOpenCodePanePrefix(plain: string): string {
  const m = /^(\s*[┃│║]\s{0,2})/.exec(plain);
  if (!m) return plain;
  return plain.slice(m[1].length);
}

/** OpenCode / Claude Code alt-screen — local ScrollView scroll is not chat history. */
export function isTuiViewport(plainRows: string[], cols: number): boolean {
  if (plainRows.length === 0) return false;
  const dividerRows = plainRows.filter((r) => /[┃│║]/.test(r)).length;
  if (dividerRows / plainRows.length > 0.12) return true;
  if (cols >= 100 && plainRows.length < 80) return true;
  return false;
}
