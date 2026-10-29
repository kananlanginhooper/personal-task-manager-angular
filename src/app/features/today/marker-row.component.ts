import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { fmt12 } from '../../shared/format';

/** A fixed line on the timeline that isn't a task: the workday, or the evening boundary from settings. */
@Component({
  selector: 'app-marker-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span></span>
    <time>{{ fmt12(time()) }}</time>
    <div class="what">
      <i class="area-dot" [style.background]="color()"></i
      ><span
        ><b>{{ label() }}</b
        ><small>{{ sub() }}</small></span
      >
    </div>
    <span class="dur">{{ dur() }}</span>
  `,
  styleUrl: './marker-row.component.scss',
})
export class MarkerRowComponent {
  readonly time = input<string | null>(null);
  readonly label = input('');
  readonly sub = input<string | undefined>('');
  readonly color = input('var(--gold)');
  readonly dur = input('—');
  readonly fmt12 = fmt12;
}
