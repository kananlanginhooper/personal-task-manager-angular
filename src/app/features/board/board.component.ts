import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { BoardLayout, ROW, bandFor } from '../../core/layout/board-layout';

/**
 * The grid the cards sit in. Its width picks the band (phone stack, standard, wide, very wide) and with
 * it the column count; cards are placed by CSS order and spans, so moving one never re-creates it.
 */
@Component({
  selector: 'app-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
    @if (layout.moving(); as m) {
      <div class="chip" [style.left.px]="m.x + 14" [style.top.px]="m.y + 12">{{ m.label }}</div>
    }
  `,
  styles: `
    :host {
      display: grid;
      grid-auto-flow: row dense;
      grid-auto-rows: ${ROW}px;
      column-gap: 20px;
      align-items: start;
      min-width: 0;
    }
    .chip {
      position: fixed;
      z-index: 50;
      pointer-events: none;
      padding: 4px 10px;
      border-radius: 8px;
      background: var(--ink);
      color: var(--surface);
      font-size: 0.8rem;
      font-weight: 600;
      box-shadow: var(--shadow);
    }
  `,
  host: {
    '[style.grid-template-columns]': '"repeat(" + layout.cols() + ", minmax(0, 1fr))"',
    '[class.stack]': 'layout.band() === "stack"',
    '[class.busy]': '!!layout.moving()',
    '[class.sizing]': '!!layout.resizing()',
  },
})
export class BoardComponent {
  readonly layout = inject(BoardLayout);

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const ro = new ResizeObserver(([e]) => this.layout.band.set(bandFor(e.contentRect.width)));
    ro.observe(el);
    inject(DestroyRef).onDestroy(() => ro.disconnect());
  }
}
