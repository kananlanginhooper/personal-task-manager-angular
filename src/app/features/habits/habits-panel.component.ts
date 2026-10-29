import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PlanStore } from '../../core/plan-store';
import { HabitDef } from '../../core/models';
import { CardComponent } from '../../shared/card/card.component';
import { addDays } from '../../shared/format';
import { HabitRowComponent } from './habit-row.component';

/** Daily small wins: the meal times from settings, then each habit group with 14-day history and streaks. */
@Component({
  selector: 'app-habits-panel',
  imports: [CardComponent, HabitRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card heading="Daily small wins" eyebrow="last 14 days" id="habitsH">
      @if (store.settings().meals?.length) {
        <div class="meals" aria-label="Eating schedule">
          @for (m of store.settings().meals; track $index) {
            <div class="meal" [class.close]="m.highlight">
              <b>{{ m.time }}</b
              >{{ m.text }}
            </div>
          }
        </div>
      }
      @for (g of groups(); track g.name) {
        <div class="hgroup">
          <div class="eyebrow">{{ g.name }}</div>
          @for (h of g.items; track h.id) {
            <app-habit-row
              [habit]="h"
              [done]="!!todayMarks()[h.id]"
              [streak]="store.streak(h.id)"
              [days]="history()[h.id]"
              (toggled)="store.toggleHabit(h, $event.done, $event.at)"
            />
          }
        </div>
      } @empty {
        <div class="empty">No daily habits set up yet.</div>
      }
    </app-card>
  `,
  styleUrl: './habits-panel.component.scss',
})
export class HabitsPanelComponent {
  readonly store = inject(PlanStore);
  private readonly last14 = [...Array(14)].map((_, i) => addDays(this.store.today, i - 13));

  readonly todayMarks = computed(() => this.store.habitDays()[this.store.today] ?? {});
  readonly groups = computed(() => {
    const out: { name: string; items: HabitDef[] }[] = [];
    for (const h of this.store.habits()) {
      let g = out.find((x) => x.name === h.groupName);
      if (!g) out.push((g = { name: h.groupName, items: [] }));
      g.items.push(h);
    }
    return out;
  });
  /** habit id → the last 14 days, for the dots */
  readonly history = computed(() => {
    const hd = this.store.habitDays();
    return Object.fromEntries(
      this.store
        .habits()
        .map((h) => [
          h.id,
          this.last14.map((date) => ({
            date,
            on: !!hd[date]?.[h.id],
            today: date === this.store.today,
          })),
        ]),
    );
  });
}
