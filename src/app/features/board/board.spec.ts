import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BoardLayout, DEFAULT_LAYOUTS, bandFor, normalize } from '../../core/layout/board-layout';
import { BoardComponent } from './board.component';
import { TileComponent } from './tile.component';

const KEY = 'gameplan.layout.v1';
const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));

describe('board layout', () => {
  beforeEach(() => localStorage.removeItem(KEY));

  it('picks the band from the board width', () => {
    expect(bandFor(500)).toBe('stack');
    expect(bandFor(1400)).toBe('standard');
    expect(bandFor(2600)).toBe('wide');
    expect(bandFor(3800)).toBe('ultra');
  });

  it('makes a saved layout whole: drops unknown cards, adds new ones, clamps sizes', () => {
    const l = normalize(
      { order: ['week', 'gone', 'week'], size: { week: { w: 99, h: 10 } } },
      'standard',
    );
    expect(l.order[0]).toBe('week');
    expect(l.order).not.toContain('gone');
    expect(l.order.length).toBe(DEFAULT_LAYOUTS.standard.order.length);
    expect(l.size['week']).toEqual({ w: 12, h: 80 });
    expect(l.size['today']).toEqual(DEFAULT_LAYOUTS.standard.size['today']);
  });

  it('moves, resizes, saves per band and resets', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const s = TestBed.inject(BoardLayout);
    s.band.set('wide');
    s.move('log', 'now');
    s.resize('log', { w: 3, h: 200 }, true);
    expect(s.current().order[0]).toBe('log');
    expect(s.isCustom()).toBeTrue();
    expect(JSON.parse(localStorage.getItem(KEY)!).wide.size.log).toEqual({ w: 3, h: 200 });

    s.band.set('standard');
    expect(s.isCustom()).toBeFalse();
    expect(s.current().order[0]).toBe('now');

    s.band.set('wide');
    expect(JSON.parse(s.exportJson()).bands.wide.order[0]).toBe('log');
    s.resetBand();
    expect(s.isCustom()).toBeFalse();
    expect(localStorage.getItem(KEY)).toBe('{}');
  });
});

@Component({
  imports: [BoardComponent, TileComponent],
  template: `
    <app-board style="width: 1400px">
      <app-tile tileKey="now" label="Now"
        ><div style="height: 100px"><h2 style="margin: 0">Now</h2></div></app-tile
      >
      <app-tile tileKey="today" label="Today"
        ><div style="height: 300px"><h2 style="margin: 0">Today</h2></div></app-tile
      >
      <app-tile tileKey="habits" label="Habits"
        ><div style="height: 200px"><h2 style="margin: 0">Habits</h2></div></app-tile
      >
    </app-board>
  `,
})
class Host {}

describe('board tiles', () => {
  beforeEach(() => localStorage.removeItem(KEY));

  async function setup() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const f = TestBed.createComponent(Host);
    document.body.append(f.nativeElement);
    await frame();
    await f.whenStable();
    await frame();
    const tile = (k: string) =>
      f.nativeElement.querySelector(`app-tile[data-tile=${k}]`) as HTMLElement;
    return { f, tile, layout: TestBed.inject(BoardLayout) };
  }
  const ptr = (type: string, x: number, y: number, target: EventTarget = window) =>
    target.dispatchEvent(
      new PointerEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true }),
    );

  it('sizes each tile to its content in 4 px rows', async () => {
    const { tile, layout } = await setup();
    expect(layout.band()).toBe('standard');
    expect(tile('today').style.gridRow).toBe('span 80'); // (300 + 20) / 4
    expect(tile('today').style.gridColumn).toBe('span 7');
  });

  it('moves a card by dragging its title onto another card', async () => {
    const { f, tile, layout } = await setup();
    const h = tile('habits').querySelector('h2')!.getBoundingClientRect();
    const t = tile('now').getBoundingClientRect();
    ptr('pointerdown', h.x + 5, h.y + 5, tile('habits').querySelector('h2')!);
    ptr('pointermove', t.x + 20, t.y + 20);
    ptr('pointerup', t.x + 20, t.y + 20);
    await f.whenStable();
    expect(layout.current().order.slice(0, 3)).toEqual(['habits', 'now', 'today']);
    expect(JSON.parse(localStorage.getItem(KEY)!).standard.order[0]).toBe('habits');
  });

  it('resizes from the lower-right corner, snapping width to columns', async () => {
    const { f, tile, layout } = await setup();
    const c = tile('today').querySelector('.corner')!.getBoundingClientRect();
    const colStep = (1400 + 20) / 12;
    ptr('pointerdown', c.x + 4, c.y + 4, tile('today').querySelector('.corner')!);
    ptr('pointermove', c.x + 4 - 2 * colStep, c.y + 4 - 100);
    ptr('pointerup', c.x + 4 - 2 * colStep, c.y + 4 - 100);
    await f.whenStable();
    expect(layout.sizeOf('today')).toEqual({ w: 5, h: 200 });
    expect(tile('today').style.gridColumn).toBe('span 5');
    expect(tile('today').classList).toContain('sized');
  });
});
