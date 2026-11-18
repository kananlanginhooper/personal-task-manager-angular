import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { TapTooltip } from '../../../for-apps/tap-tooltip';
import { Task } from '../../core/models';
import { Check, StepCheck } from '../../shared/check';
import { draggingOfHost } from '../../shared/dragging';
import { estChanged, fmt12, fmtDur, taskSub, taskTotal } from '../../shared/format';
import { pointOf } from '../../shared/point';

/** One task on today's timeline: drag grip, checkbox, title, steps and duration. */
@Component({
  selector: 'app-today-row',
  imports: [CdkDragHandle, MatCheckbox, MatIcon, TapTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today-row.component.html',
  styleUrl: './today-row.component.scss',
  host: { class: 'row', '[class.done]': 'task().done', '[class.fixed]': 'task().locked' },
})
export class TodayRowComponent {
  readonly task = input.required<Task>();
  readonly color = input('');
  readonly problem = input<string | undefined>();
  readonly toggled = output<Check>();
  readonly stepToggled = output<StepCheck>();
  readonly opened = output<void>();

  readonly fmt12 = fmt12;
  readonly fmtDur = fmtDur;
  readonly pointOf = pointOf;
  readonly dragging = draggingOfHost();
  readonly changed = computed(() => estChanged(this.task()));
  readonly total = computed(() => taskTotal(this.task()));
  readonly sub = computed(() => this.task().note || taskSub(this.task()));
}
