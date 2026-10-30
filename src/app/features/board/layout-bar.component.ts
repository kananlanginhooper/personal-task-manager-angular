import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { CelebrateService } from '../../core/celebrate.service';
import { BANDS, BoardLayout, GridBand } from '../../core/layout/board-layout';
import { PlanStore } from '../../core/plan-store';

/** The strip under the board: which layout is in use, and ways to share it or go back to the default. */
@Component({
  selector: 'app-layout-bar',
  imports: [MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (band(); as b) {
      <span>
        <b>Layout</b> · {{ b.label }}, {{ b.cols }} columns ·
        {{ layout.isCustom() ? 'your arrangement, saved in this browser' : 'the default' }}.
        <span class="how"
          >Drag a card by its title or top handle; resize it from its lower-right corner.</span
        >
      </span>
      <span class="actions">
        <button
          matButton
          class="small"
          type="button"
          [disabled]="!layout.anyCustom()"
          (click)="copy()"
        >
          Copy layout
        </button>
        <button
          matButton
          class="small"
          type="button"
          [disabled]="!layout.anyCustom()"
          (click)="send()"
        >
          Send to Claude
        </button>
        <button
          matButton
          class="small"
          type="button"
          [disabled]="!layout.isCustom()"
          (click)="reset()"
        >
          {{ confirming() ? 'Click again to reset' : 'Reset this size' }}
        </button>
      </span>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--muted);
      padding: 8px 14px;
      border-radius: 10px;
      box-shadow: inset 0 0 0 1px var(--line);
    }
    :host:empty {
      display: none;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  `,
})
export class LayoutBarComponent {
  readonly layout = inject(BoardLayout);
  private readonly store = inject(PlanStore);
  private readonly fx = inject(CelebrateService);
  readonly confirming = signal(false);

  readonly band = computed(() => {
    const b = this.layout.band();
    return b === 'stack' ? null : BANDS[b as GridBand];
  });

  async copy() {
    const text = this.layout.exportJson();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // plain http on the LAN has no clipboard API; the old way still works there
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    this.fx.note('Paste it to Claude to make it the default.', 'Layout copied', '⧉');
  }

  send() {
    void this.store.addNote(
      `Please make this card layout the default (paste into DEFAULT_LAYOUTS):\n${this.layout.exportJson()}`,
    );
  }

  reset() {
    if (!this.confirming()) {
      this.confirming.set(true);
      setTimeout(() => this.confirming.set(false), 4000);
      return;
    }
    this.confirming.set(false);
    this.layout.resetBand();
  }
}
