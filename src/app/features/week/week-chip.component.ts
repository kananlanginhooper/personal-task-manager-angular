import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Task } from '../../core/models';
import { estChanged, fmt12, taskSub } from '../../shared/format';

/** One task in a week column. */
@Component({
  selector: 'app-week-chip',
  imports: [CdkDragHandle, MatIcon, MatTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let t = task();
    @if (t.locked) {
      <span class="grip lock" matTooltip="Fixed event">•</span>
    } @else {
      <span class="grip" cdkDragHandle matTooltip="Drag to move" aria-label="Drag to move"
        ><mat-icon>drag_indicator</mat-icon></span
      >
    }
    <div
      class="t"
      role="button"
      tabindex="0"
      (click)="opened.emit()"
      (keydown.enter)="opened.emit()"
    >
      <span>{{ t.title }}</span>
      <small
        >{{ t.start ? fmt12(t.start) : 'any time' }} ·
        @if (changed()) {
          <b>{{ t.origEst }}→{{ t.est }} m</b>
        } @else {
          {{ sub() }}
        }
      </small>
      @if (problem(); as p) {
        <small class="problem">{{ p }}</small>
      }
    </div>
  `,
  styleUrl: './week-chip.component.scss',
  host: {
    '[class.fixed]': 'task().locked',
    '[class.call]': "task().kind === 'call'",
    '[class.done]': 'task().done',
    '[class.warnc]': '!!problem()',
    '[style.--lc]': 'color()',
  },
})
export class WeekChipComponent {
  readonly task = input.required<Task>();
  readonly color = input('');
  readonly problem = input<string | undefined>();
  readonly opened = output<void>();
  readonly fmt12 = fmt12;
  readonly changed = computed(() => estChanged(this.task()));
  readonly sub = computed(() => taskSub(this.task()));
}
