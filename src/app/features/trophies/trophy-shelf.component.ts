import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { PlanStore } from '../../core/plan-store';
import { progress } from '../../core/trophy-rules';
import { CardComponent } from '../../shared/card/card.component';
import { MON } from '../../shared/format';
import { TrophyCupComponent } from '../../shared/trophy-cup/trophy-cup.component';

/** Every trophy on a wooden shelf: earned ones first, then the closest to earning. */
@Component({
  selector: 'app-trophy-shelf',
  imports: [MatProgressBar, MatTooltip, CardComponent, TrophyCupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trophy-shelf.component.html',
  styleUrl: './trophy-shelf.component.scss',
})
export class TrophyShelfComponent {
  readonly store = inject(PlanStore);

  readonly list = computed(() => {
    const f = this.store.facts(),
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
}
