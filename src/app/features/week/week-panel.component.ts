import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { PlanStore } from '../../core/plan-store';
import { Task } from '../../core/models';
import { CardComponent } from '../../shared/card/card.component';
import { DOW, MON, addDays, parseD, taskTotal } from '../../shared/format';
import { WeekChipComponent } from './week-chip.component';

/** Seven day columns; tasks drag between them and to and from today's timeline. */
@Component({
  selector: 'app-week-panel',
  imports: [
    CdkDropList,
    CdkDrag,
    MatButton,
    MatIconButton,
    MatIcon,
    MatProgressBar,
    CardComponent,
    WeekChipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './week-panel.component.html',
  styleUrl: './week-panel.component.scss',
})
export class WeekPanelComponent {
  readonly store = inject(PlanStore);

  readonly days = computed(() => {
    this.store.tasks();
    return [...Array(7)].map((_, i) => {
      const date = addDays(this.store.weekStart(), i),
        dt = parseD(date),
        tasks = this.store.tasksOn(date);
      const pct = Math.min(
        100,
        Math.round(
          (tasks.reduce((a, t) => a + taskTotal(t), 0) / this.store.capacityOf(date)) * 100,
        ),
      );
      return {
        date,
        tasks,
        pct,
        dow: DOW[dt.getDay()],
        label: `${MON[dt.getMonth()]} ${dt.getDate()}`,
      };
    });
  });
  readonly label = computed(() => {
    const d = this.days();
    return `${d[0].label} – ${d[6].label}`;
  });

  shift(n: number) {
    this.store.weekStart.update((w) => addDays(w, n));
  }
  add() {
    const w = this.store.weekStart();
    this.store.editor.set({ date: w > this.store.today ? w : this.store.today });
  }
  drop(e: CdkDragDrop<string, string, Task>) {
    this.store.dropAt(e.item.data, e.container.data, e.currentIndex);
  }
}
