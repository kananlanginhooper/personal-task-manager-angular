import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { PlanStore } from '../../core/plan-store';
import { fmtDur, taskTotal } from '../../shared/format';
import { pointOf } from '../../shared/point';

/** "N things slipped past their day": lists them and offers to rebuild the week. */
@Component({
  selector: 'app-replan-banner',
  imports: [MatButton, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let n = store.overdue().length;
    <div class="icon"><mat-icon>autorenew</mat-icon></div>
    <div>
      <b
        >{{ n }} thing{{ n > 1 ? 's' : '' }} slipped past {{ n > 1 ? 'their' : 'its' }} day, and
        that's fine.</b
      >
      <p>
        Missing a day isn't failing. Rebuilding moves each one to the lightest open evening, and big
        ones get split in half. Every move is logged.
      </p>
      <ul>
        @for (t of store.overdue().slice(0, 6); track t.id) {
          <li>
            {{ t.title }} <span class="mono">({{ t.date.slice(5) }}, {{ fmtDur(total(t)) }})</span>
          </li>
        }
      </ul>
    </div>
    <div>
      <button matButton="filled" type="button" (click)="store.rebuild(pointOf($event))">
        Rebuild my week
      </button>
    </div>
  `,
  styleUrl: './replan-banner.component.scss',
  host: { role: 'region', 'aria-label': 'Missed items' },
})
export class ReplanBannerComponent {
  readonly store = inject(PlanStore);
  readonly fmtDur = fmtDur;
  readonly total = taskTotal;
  readonly pointOf = pointOf;
}
