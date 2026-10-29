import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { PlanStore } from '../../core/plan-store';
import { Task } from '../../core/models';
import { CardComponent } from '../../shared/card/card.component';
import { isWeekend, taskTotal, toMin } from '../../shared/format';
import { MarkerRowComponent } from './marker-row.component';
import { TodayRowComponent } from './today-row.component';

/** Today's timeline. Drag rows by the grip to reorder, or onto a day in the week below. */
@Component({
  selector: 'app-today-panel',
  imports: [
    CdkDropList,
    CdkDrag,
    MatButton,
    MatProgressBar,
    CardComponent,
    MarkerRowComponent,
    TodayRowComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today-panel.component.html',
  styleUrl: './today-panel.component.scss',
})
export class TodayPanelComponent {
  readonly store = inject(PlanStore);

  readonly list = computed(() => {
    this.store.tasks();
    return this.store.tasksOn(this.store.today);
  });
  readonly boundary = computed(() => this.store.settings().boundary);
  readonly workday = computed(() =>
    isWeekend(this.store.today) ? null : (this.store.settings().workday ?? null),
  );
  private readonly cut = computed(() => toMin(this.boundary()?.time) ?? 24 * 60);
  /** Index of the first task at or after the day's boundary time from settings. */
  readonly cutIndex = computed(() => {
    const i = this.list().findIndex((t) => (toMin(t.start) ?? 1e4) >= this.cut());
    return i < 0 ? this.list().length : i;
  });
  /** How much of today's free evening time is planned. */
  readonly pct = computed(() => {
    const evening = this.list().filter(
      (t) => !t.work && (!t.start || toMin(t.start)! >= 16 * 60 || isWeekend(this.store.today)),
    );
    return Math.min(
      100,
      Math.round(
        (evening.reduce((a, t) => a + taskTotal(t), 0) / this.store.capacityOf(this.store.today)) *
          100,
      ),
    );
  });

  drop(e: CdkDragDrop<string, string, Task>) {
    this.store.dropAt(e.item.data, e.container.data, e.currentIndex);
  }
}
