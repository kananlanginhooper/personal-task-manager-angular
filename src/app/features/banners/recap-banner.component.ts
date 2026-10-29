import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { PlanStore } from '../../core/plan-store';
import { parseD } from '../../shared/format';

/** Sunday evening and Monday morning: "Your week is in", until the recap has been opened. */
@Component({
  selector: 'app-recap-banner',
  imports: [MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <section class="recap-banner">
        <div>
          <b>Your week is in.</b>
          <div class="muted">Wins, streaks, trophies, and what's next. Takes one minute.</div>
        </div>
        <button matButton="filled" type="button" (click)="open()">Open my Sunday recap</button>
      </section>
    }
  `,
  styleUrl: './recap-banner.component.scss',
})
export class RecapBannerComponent {
  readonly store = inject(PlanStore);
  private readonly seen = signal(false);

  readonly show = computed(() => {
    if (this.seen()) return false;
    const d = parseD(this.store.today).getDay(),
      h = new Date().getHours();
    if (!((d === 0 && h >= 17) || (d === 1 && h < 12))) return false;
    try {
      return localStorage.getItem('ptm-recap-' + this.store.recapWeek()) !== '1';
    } catch {
      return true;
    }
  });

  open() {
    this.seen.set(true);
    this.store.recap.set(this.store.recapWeek());
  }
}
