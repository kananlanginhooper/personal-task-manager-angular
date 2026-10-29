import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Project } from '../../core/models';
import { StepCheck } from '../../shared/check';
import { pointOf } from '../../shared/point';

const PRIO: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  steady: 'Steady',
  later: 'Later',
};

/** One goal: priority, progress, its steps as checkboxes, and the next step. */
@Component({
  selector: 'app-goal-card',
  imports: [MatCheckbox, MatProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './goal-card.component.html',
  styleUrl: './goal-card.component.scss',
  host: { '[style.--lc]': 'color()' },
})
export class GoalCardComponent {
  readonly project = input.required<Project>();
  readonly color = input('');
  readonly stepToggled = output<StepCheck>();
  readonly pointOf = pointOf;

  readonly prioLabel = computed(() => PRIO[this.project().prio] ?? this.project().prio);
  readonly doneCount = computed(() => this.project().steps.filter((s) => s.done).length);
  readonly pct = computed(() => {
    const n = this.project().steps.length;
    return n ? Math.round((this.doneCount() / n) * 100) : 0;
  });
  readonly meta = computed(() => {
    const p = this.project();
    return [p.due ? `due ${p.due}` : '', p.est ?? ''].filter(Boolean).join(' · ');
  });
  readonly next = computed(() => {
    const p = this.project();
    return p.next || p.steps.find((s) => !s.done)?.t;
  });
}
