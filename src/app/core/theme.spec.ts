import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { THEME_KEY, Theme } from './theme';

describe('Theme', () => {
  beforeEach(() => {
    localStorage.removeItem(THEME_KEY);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });
  afterEach(() => {
    localStorage.removeItem(THEME_KEY);
    document.documentElement.style.colorScheme = '';
  });

  it('follows the system until toggled, then flips, applies and remembers the choice', () => {
    const theme = TestBed.inject(Theme);
    const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    expect(theme.mode()).toBe(system);
    expect(document.documentElement.style.colorScheme).toBe('');

    theme.toggle();
    TestBed.tick();
    const flipped = system === 'dark' ? 'light' : 'dark';
    expect(theme.mode()).toBe(flipped);
    expect(document.documentElement.style.colorScheme).toBe(flipped);
    expect(localStorage.getItem(THEME_KEY)).toBe(flipped);

    theme.toggle();
    TestBed.tick();
    expect(theme.mode()).toBe(system);
    expect(localStorage.getItem(THEME_KEY)).toBe(system);
  });
});
