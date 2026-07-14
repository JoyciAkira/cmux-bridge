import { inferPrimaryColumns } from './inferPrimaryColumns';

/**
 * Sticky primary-column tracker — prevents layoutCols jitter when OpenCode
 * chrome rows appear/disappear between frames (font/lineHeight thrash → scroll stuck).
 */
export class StickyPrimaryColumns {
  private value: number | null = null;
  private pending: number | null = null;
  private pendingHits = 0;

  reset(): void {
    this.value = null;
    this.pending = null;
    this.pendingHits = 0;
  }

  next(plainRows: string[], relayCols: number): number {
    const inferred = inferPrimaryColumns(plainRows, relayCols);
    if (this.value == null) {
      this.value = inferred;
      return inferred;
    }

    if (inferred === this.value) {
      this.pending = null;
      this.pendingHits = 0;
      return this.value;
    }

    // Prefer locking onto a tighter chrome gutter once; require 3 consistent
    // frames before widening back (avoids flicker when a few rows lack MCP).
    const tightening = inferred < this.value;
    const needed = tightening ? 1 : 3;
    if (this.pending === inferred) {
      this.pendingHits += 1;
    } else {
      this.pending = inferred;
      this.pendingHits = 1;
    }
    if (this.pendingHits >= needed) {
      this.value = inferred;
      this.pending = null;
      this.pendingHits = 0;
    }
    return this.value;
  }
}
