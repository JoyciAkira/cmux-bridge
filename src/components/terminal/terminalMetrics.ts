/** Monospace cell width estimate without Skia font metrics. */
export function estimateCellAdvance(fontSize: number): number {
  return Math.max(1, Math.round(fontSize * 0.6));
}

function toHexByte(value: number): string {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
}

/** Skia expects #rrggbb — normalize rgb() and short hex. */
export function toCanvasColor(color: string): string {
  if (color.startsWith('#')) {
    if (color.length === 4) {
      const r = color[1];
      const g = color[2];
      const b = color[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    return color;
  }
  const rgbMatch = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(color);
  if (rgbMatch) {
    return `#${toHexByte(Number(rgbMatch[1]))}${toHexByte(Number(rgbMatch[2]))}${toHexByte(Number(rgbMatch[3]))}`;
  }
  return color;
}
