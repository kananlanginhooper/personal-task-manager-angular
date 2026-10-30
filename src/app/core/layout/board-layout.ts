import { Injectable, computed, signal } from '@angular/core';

/**
 * Card arrangement for the page: which order the cards go in and how big each one is.
 * Each screen size ("band") keeps its own arrangement, so a layout made on a very wide monitor
 * doesn't squash a normal one. Saved in this browser only; the defaults below are the starting point.
 */

/** stack = phone/narrow, one column, no moving or resizing */
export type Band = 'stack' | 'standard' | 'wide' | 'ultra';
export type GridBand = Exclude<Band, 'stack'>;

/** w = columns spanned; h = body height in px, or null to fit the content */
export interface TileSize {
  w: number;
  h: number | null;
}
export interface BandLayout {
  order: string[];
  size: Record<string, TileSize>;
}
export type SavedLayouts = Partial<Record<GridBand, BandLayout>>;

export const BANDS: Record<GridBand, { cols: number; minWidth: number; label: string }> = {
  standard: { cols: 12, minWidth: 900, label: 'Standard screen' },
  wide: { cols: 24, minWidth: 2200, label: 'Wide screen' },
  ultra: { cols: 24, minWidth: 3400, label: 'Very wide screen' },
};
/** board narrower than this stacks the cards in one column */
export const STACK_BELOW = BANDS.standard.minWidth;
/** grid row unit and the gap between cards, in px */
export const ROW = 4;
export const GAP = 20;
export const MIN_HEIGHT = 80;

/** The page's order on a phone, and the order new cards join a saved layout in. */
export const TILE_ORDER = [
  'now',
  'today',
  'habits',
  'week',
  'evening',
  'shopping',
  'goals',
  'notes',
  'trophies',
  'coming',
  'wins',
  'log',
];

function band(order: string[], w: Record<string, number>): BandLayout {
  return { order, size: Object.fromEntries(order.map((k) => [k, { w: w[k], h: null }])) };
}

export const DEFAULT_LAYOUTS: Record<GridBand, BandLayout> = {
  // the classic two-column page
  standard: band(TILE_ORDER, {
    now: 12,
    today: 7,
    habits: 5,
    week: 7,
    evening: 5,
    shopping: 5,
    goals: 12,
    notes: 12,
    trophies: 12,
    coming: 4,
    wins: 4,
    log: 4,
  }),
  // the week needs about half the width for seven readable days
  wide: band(
    [
      'now',
      'today',
      'week',
      'habits',
      'evening',
      'shopping',
      'goals',
      'notes',
      'trophies',
      'coming',
      'wins',
      'log',
    ],
    {
      now: 6,
      today: 6,
      week: 12,
      habits: 6,
      evening: 6,
      shopping: 6,
      goals: 6,
      notes: 6,
      trophies: 12,
      coming: 4,
      wins: 4,
      log: 4,
    },
  ),
  ultra: band(
    [
      'now',
      'today',
      'week',
      'habits',
      'evening',
      'shopping',
      'goals',
      'notes',
      'trophies',
      'coming',
      'wins',
      'log',
    ],
    {
      now: 5,
      today: 5,
      week: 9,
      habits: 5,
      evening: 5,
      shopping: 5,
      goals: 5,
      notes: 5,
      trophies: 9,
      coming: 5,
      wins: 5,
      log: 5,
    },
  ),
};

const KEY = 'gameplan.layout.v1';

export function bandFor(width: number): Band {
  if (width >= BANDS.ultra.minWidth) return 'ultra';
  if (width >= BANDS.wide.minWidth) return 'wide';
  if (width >= BANDS.standard.minWidth) return 'standard';
  return 'stack';
}

/** A saved layout made whole: unknown cards dropped, new cards added from the defaults, sizes clamped. */
export function normalize(saved: BandLayout | undefined, b: GridBand): BandLayout {
  const def = DEFAULT_LAYOUTS[b];
  const cols = BANDS[b].cols;
  const known = new Set(TILE_ORDER);
  const order = (saved?.order ?? []).filter((k, i, a) => known.has(k) && a.indexOf(k) === i);
  for (const k of def.order) if (!order.includes(k)) order.push(k);
  const size: Record<string, TileSize> = {};
  for (const k of order) {
    const s = saved?.size?.[k] ?? def.size[k];
    const w = Math.round(Number(s?.w)) || def.size[k].w;
    const h = s?.h == null ? null : Math.max(MIN_HEIGHT, Math.round(Number(s.h)) || MIN_HEIGHT);
    size[k] = { w: Math.min(cols, Math.max(1, w)), h };
  }
  return { order, size };
}

function load(): SavedLayouts {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

@Injectable({ providedIn: 'root' })
export class BoardLayout {
  /** set by the board from its own width */
  readonly band = signal<Band>('standard');
  readonly cols = computed(() =>
    this.band() === 'stack' ? 1 : BANDS[this.band() as GridBand].cols,
  );
  /** the card being moved, for the label that follows the pointer */
  readonly moving = signal<{ key: string; label: string; x: number; y: number } | null>(null);
  readonly resizing = signal<string | null>(null);

  private readonly saved = signal<SavedLayouts>(load());

  /** the arrangement in use for the current band */
  readonly current = computed<BandLayout>(() => {
    const b = this.band();
    if (b === 'stack') return band(TILE_ORDER, Object.fromEntries(TILE_ORDER.map((k) => [k, 1])));
    return normalize(this.saved()[b], b);
  });
  readonly isCustom = computed(() => {
    const b = this.band();
    return b !== 'stack' && !!this.saved()[b];
  });
  readonly anyCustom = computed(() => Object.keys(this.saved()).length > 0);

  orderOf(key: string) {
    return this.current().order.indexOf(key);
  }
  sizeOf(key: string): TileSize {
    return this.current().size[key] ?? { w: this.cols(), h: null };
  }

  /** move `key` to where `target` is (after it when moving forward, before it when moving back) */
  move(key: string, target: string) {
    const order = [...this.current().order];
    const from = order.indexOf(key);
    const to = order.indexOf(target);
    if (from < 0 || to < 0 || from === to) return;
    order.splice(from, 1);
    order.splice(to, 0, key);
    this.update({ ...this.current(), order }, false);
  }

  resize(key: string, s: TileSize, persist: boolean) {
    const cur = this.current();
    this.update({ ...cur, size: { ...cur.size, [key]: s } }, persist);
  }

  /** a card back to its default width, fitting its content */
  resetTile(key: string) {
    const b = this.band();
    if (b === 'stack') return;
    this.resize(key, { ...DEFAULT_LAYOUTS[b].size[key], h: null }, true);
  }

  resetBand() {
    const b = this.band();
    if (b === 'stack') return;
    const rest = { ...this.saved() };
    delete rest[b];
    this.saved.set(rest);
    this.persist();
  }

  /** writes the in-memory arrangement to the browser (after a drag ends) */
  persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.saved()));
    } catch {
      // private window or storage blocked: the layout still works until reload
    }
  }

  /** every customized band, ready to paste into DEFAULT_LAYOUTS */
  exportJson(): string {
    const out: SavedLayouts = {};
    for (const b of Object.keys(BANDS) as GridBand[]) {
      if (this.saved()[b]) out[b] = normalize(this.saved()[b], b);
    }
    return JSON.stringify({ layoutVersion: 1, bands: out }, null, 1);
  }

  private update(l: BandLayout, persist: boolean) {
    const b = this.band();
    if (b === 'stack') return;
    this.saved.update((s) => ({ ...s, [b]: l }));
    if (persist) this.persist();
  }
}
