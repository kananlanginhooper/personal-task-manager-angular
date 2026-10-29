import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { PlanStore } from '../../core/plan-store';
import { DOW, MON, fmtDur, isoWeek, parseD, taskTotal } from '../../shared/format';
import { ProgressRingComponent } from '../../shared/progress-ring/progress-ring.component';

/** Date line, headline, today's free time, and the score ring with the week recap button. */
@Component({
  selector: 'app-page-header',
  imports: [MatButton, ProgressRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="eyebrow">{{ dateLine }}</div>
      <h1>
        {{ headline()[0] }} <span>{{ headline()[1] }}</span>
      </h1>
      <p>{{ capLine() }}</p>
    </div>
    <div class="score" aria-live="polite">
      <app-progress-ring [value]="score().pct" />
      <div>
        <b>{{ score().done }} of {{ score().all }} today</b><small>{{ score().sub }}</small>
      </div>
      <button
        matButton="outlined"
        class="small"
        type="button"
        (click)="store.recap.set(store.recapWeek())"
      >
        Week recap
      </button>
    </div>
  `,
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly store = inject(PlanStore);

  readonly dateLine = (() => {
    const d = parseD(this.store.today);
    return `${DOW[d.getDay()]} · ${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · Week ${isoWeek(this.store.today)}`;
  })();
  readonly headline = computed(
    () => this.store.settings().headline ?? ['Small wins,', 'stacked daily.'],
  );

  readonly score = computed(() => {
    const s = this.store,
      tasks = s.tasksOn(s.today).filter((t) => !t.work && !t.locked);
    const marks = s.habitDays()[s.today] ?? {};
    const done = tasks.filter((t) => t.done).length + s.habits().filter((h) => marks[h.id]).length;
    const all = tasks.length + s.habits().length,
      pct = all ? done / all : 0;
    const sub =
      pct >= 0.75
        ? 'This is a great day. Seriously.'
        : pct >= 0.4
          ? 'Solid. Keep stacking.'
          : done
            ? "You've started. That's the hard part."
            : 'Every check counts. Even the tiny ones.';
    return { done, all, pct, sub };
  });

  readonly capLine = computed(() => {
    const s = this.store,
      load = s
        .tasksOn(s.today)
        .filter((t) => !t.work)
        .reduce((a, t) => a + taskTotal(t), 0);
    return `${fmtDur(s.capacityOf(s.today))} free today · ${fmtDur(load)} planned · the rest is breathing room on purpose. Drag ⋮⋮ to move, click a task to change it.`;
  });
}
