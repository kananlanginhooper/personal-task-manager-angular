import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

/** Saved choice; index.html reads the same key before the app starts, so the page never flashes the other theme. */
export const THEME_KEY = 'gameplan.theme.v1';

/** Light or dark. Follows the system until the header button is used, then remembers that choice on this device.
 *  The shared theme is built on light-dark(), so setting `color-scheme` on <html> is all it takes. */
@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly media =
    typeof matchMedia === 'undefined' ? null : matchMedia('(prefers-color-scheme: dark)');
  private readonly system = signal<ThemeMode>(this.media?.matches ? 'dark' : 'light');
  private readonly chosen = signal<ThemeMode | null>(read());

  readonly mode = computed(() => this.chosen() ?? this.system());

  constructor() {
    this.media?.addEventListener('change', (e) => this.system.set(e.matches ? 'dark' : 'light'));
    effect(() => {
      const c = this.chosen();
      document.documentElement.style.colorScheme = c ?? '';
    });
  }

  toggle(): void {
    const next: ThemeMode = this.mode() === 'dark' ? 'light' : 'dark';
    this.chosen.set(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // private mode: the choice lasts until reload
    }
  }
}

function read(): ThemeMode | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}
