// Strip ANSI/VT control sequences (CSI + single-char ESC).
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
const BOX_RE = /^[\s\u2500-\u257F\u2580-\u259F\u25A0-\u25FF]+$/u;

/** Visible terminal text for one screen row. */
export function visibleTerminalLine(raw: string): string {
  const stripped = raw.replace(ANSI_RE, '').replace(/\r/g, '');
  if (!stripped) return '';
  return BOX_RE.test(stripped) ? '' : stripped;
}
