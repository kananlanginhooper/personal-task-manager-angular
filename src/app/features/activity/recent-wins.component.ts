import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PlanStore } from '../../core/plan-store';
import { CardComponent } from '../../shared/card/card.component';
import { addDays, clock } from '../../shared/format';

/** The last few wins from the change log, and this week's planned spending. */
@Component({
  selector: 'app-recent-wins',
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card heading="Recent wins" eyebrow="the highlight reel" id="winsH">
      <div class="wins">
        @for (c of wins(); track $index) {
          <div class="win">
            <span class="star">★</span>
            <div>
              {{ c.title }}<small>{{ clock(c.at) }}</small>
            </div>
          </div>
        } @empty {
          <div class="empty">Your first win will show up here. Small ones count.</div>
        }
      </div>
      <div class="eyebrow budget">Budget this week</div>
      <div class="money">
        @for (t of costs(); track t.id) {
          <div class="mrow">
            <span>{{ t.title }}</span
            ><span>\${{ t.cost }}</span>
          </div>
        }
        <div class="mrow total">
          <span>Planned</span><span>\${{ costTotal() }}</span>
        </div>
      </div>
    </app-card>
  `,
  styleUrl: './activity.scss',
})
export class RecentWinsComponent {
  readonly store = inject(PlanStore);
  readonly clock = clock;
  readonly wins = computed(() =>
    this.store
      .changes()
      .filter((c) => ['done', 'habit', 'step', 'swap', 'trophy'].includes(c.type))
      .slice(0, 6),
  );
  readonly costs = computed(() => {
    const days = [...Array(7)].map((_, i) => addDays(this.store.weekStart(), i));
    return this.store
      .tasks()
      .filter((t) => days.includes(t.date) && t.cost && t.status !== 'skipped');
  });
  readonly costTotal = computed(() => this.costs().reduce((a, t) => a + (t.cost ?? 0), 0));
}
