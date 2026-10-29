import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PlanStore } from '../../core/plan-store';
import { CardComponent } from '../../shared/card/card.component';
import { DOW, MON, fmt12, parseD } from '../../shared/format';

/** Upcoming reminders (each repeat once, at its next date), then the recurring rules. */
@Component({
  selector: 'app-coming-up',
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card heading="Coming up" eyebrow="reminders" id="remH">
      @for (t of reminders(); track t.id) {
        <div class="rem">
          <div class="when">
            {{ dow(t.date) }}<b>{{ md(t.date) }}</b>
          </div>
          <div>
            <b>{{ t.title }}</b
            ><small>{{ t.note || (t.start ? fmt12(t.start) : '') }}</small>
          </div>
          <span class="freq">{{ t.recurring ? 'repeats' : 'once' }}</span>
        </div>
      } @empty {
        <div class="empty">No reminders coming up.</div>
      }
      <div class="eyebrow recurring">Recurring</div>
      @for (r of store.recurring(); track r.id) {
        <div class="rem">
          <div class="when">{{ r.short }}</div>
          <div>
            <b>{{ r.title }}</b
            ><small>{{ r.rule }}</small>
          </div>
          <span class="freq">{{ r.freq }}</span>
        </div>
      }
    </app-card>
  `,
  styleUrl: './activity.scss',
})
export class ComingUpComponent {
  readonly store = inject(PlanStore);
  readonly fmt12 = fmt12;
  readonly reminders = computed(() =>
    this.store
      .tasks()
      .filter((t) => t.remind && t.date >= this.store.today && !t.done && t.status !== 'skipped')
      .sort((a, b) => a.date.localeCompare(b.date))
      // a repeat shows once, at its next date
      .filter((t, i, list) => !t.recurring || list.findIndex((x) => x.title === t.title) === i)
      .slice(0, 6),
  );

  dow(d: string) {
    return DOW[parseD(d).getDay()].toUpperCase();
  }
  md(d: string) {
    const x = parseD(d);
    return `${MON[x.getMonth()]} ${x.getDate()}`;
  }
}
