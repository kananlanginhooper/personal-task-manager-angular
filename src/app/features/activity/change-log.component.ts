import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PlanStore } from '../../core/plan-store';
import { Change } from '../../core/models';
import { CardComponent } from '../../shared/card/card.component';
import { clock, fmt12 } from '../../shared/format';

const DESC: Record<string, string> = {
  move: 'Moved',
  estimate: 'New estimate',
  done: 'Done',
  undone: 'Unchecked',
  add: 'Added',
  split: 'Split',
  skip: 'Dropped',
  replan: 'Rebuilt',
  step: 'Step done',
  unstep: 'Step unchecked',
  habit: 'Habit',
  swap: 'Evening swap',
  shop: 'Shopping',
  edit: 'Edited',
  trophy: 'Trophy',
};

/** The person's recent changes (moves, estimates, splits), which an assistant reads to re-plan. */
@Component({
  selector: 'app-change-log',
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card heading="Your changes" eyebrow="Claude reads this" id="logH">
      <div class="log">
        @for (c of log(); track $index) {
          <div>
            <time>{{ clock(c.at) }}</time
            ><span
              ><b>{{ desc[c.type] || c.type }}</b> {{ c.title }}
              <span class="muted">{{ detail(c) }}</span></span
            >
          </div>
        } @empty {
          <div class="empty">
            No changes yet. When you move a task or change an estimate, it shows up here, and Claude
            reads it.
          </div>
        }
      </div>
    </app-card>
  `,
  styleUrl: './activity.scss',
})
export class ChangeLogComponent {
  readonly store = inject(PlanStore);
  readonly clock = clock;
  readonly desc = DESC;
  readonly log = computed(() =>
    this.store
      .changes()
      .filter((c) => !['habit', 'swap'].includes(c.type))
      .slice(0, 25),
  );

  detail(c: Change): string {
    if (c.type === 'move' || c.type === 'replan')
      return `${c.from?.date?.slice(5) ?? ''} ${fmt12(c.from?.start)} → ${c.to?.date?.slice(5) ?? ''} ${fmt12(c.to?.start)}`;
    if (c.type === 'estimate')
      return `${c.from?.est} → ${c.to?.est} m${c.reason ? ` · “${c.reason}”` : ''}`;
    return c.reason ? `· “${c.reason}”` : '';
  }
}
