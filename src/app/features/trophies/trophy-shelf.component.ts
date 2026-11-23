import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TapTooltip } from '../../../for-apps/tap-tooltip';
import { LITE } from '../../core/display';
import { PlanStore } from '../../core/plan-store';
import { progress } from '../../core/trophy-rules';
import { CardComponent } from '../../shared/card/card.component';
import { MON } from '../../shared/format';
import { TrophyCupComponent } from '../../shared/trophy-cup/trophy-cup.component';

/** Every trophy on a wooden shelf: earned ones first, then the closest to earning. */
@Component({
  selector: 'app-trophy-shelf',
  imports: [MatProgressBar, TapTooltip, CardComponent, TrophyCupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trophy-shelf.component.html',
  styleUrl: './trophy-shelf.component.scss',
})
export class TrophyShelfComponent {
  readonly store = inject(PlanStore);
  /** Low-power screens: each trophy re-walks the whole history (streaks day by day), so after a change the shelf
   *  catches up once a small win's stars have crossed (2.8 s, like the log and Recent wins), not in the same frame
   *  as the check-off. The first load shows at once. */
  private readonly facts = LITE ? this.lagged() : this.store.facts;

  readonly list = computed(() => {
    const f = this.facts(),
      awards = this.store.awards();
    return this.store
      .trophies()
      .map((t) => {
        const a = awards[t.id],
          d = a ? new Date(a.earnedAt) : null;
        return {
          ...t,
          p: Math.min(t.goal, progress(t.rule, f)),
          earned: !!a,
          when: d ? `${MON[d.getMonth()]} ${d.getDate()}` : '',
        };
      })
      .sort((a, b) => Number(b.earned) - Number(a.earned) || b.p / b.goal - a.p / a.goal);
  });
  readonly earnedCount = computed(() => this.list().filter((t) => t.earned).length);

  private lagged() {
    const out = signal(untracked(this.store.facts));
    effect((onCleanup) => {
      const f = this.store.facts();
      if (!untracked(this.store.loaded) || untracked(out).tasks.length === 0) {
        out.set(f);
        return;
      }
      const t = setTimeout(() => out.set(f), 2800);
      onCleanup(() => clearTimeout(t));
    });
    return out.asReadonly();
  }
}
