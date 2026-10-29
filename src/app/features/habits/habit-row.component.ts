import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { HabitDef } from '../../core/models';
import { Check } from '../../shared/check';
import { pointOf } from '../../shared/point';

/** One daily habit: checkbox, name, the last 14 days as dots, and the streak. */
@Component({
  selector: 'app-habit-row',
  imports: [MatCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-checkbox
      [checked]="done()"
      [aria-label]="habit().name"
      (change)="toggled.emit({ done: $event.checked, at: pointOf($event) })"
    >
      <b>{{ habit().name }}</b
      ><small>{{ habit().sub }}</small>
    </mat-checkbox>
    <div>
      <div class="dots" aria-hidden="true">
        @for (d of days(); track d.date) {
          <i [class.on]="d.on" [class.today]="d.today"></i>
        }
      </div>
      <div class="streak">{{ streak() ? streak() + '-day streak' : 'start today' }}</div>
    </div>
  `,
  styleUrl: './habit-row.component.scss',
})
export class HabitRowComponent {
  readonly habit = input.required<HabitDef>();
  readonly done = input(false);
  readonly streak = input(0);
  /** the last 14 days, oldest first */
  readonly days = input<{ date: string; on: boolean; today: boolean }[]>([]);
  readonly toggled = output<Check>();
  readonly pointOf = pointOf;
}
