import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { PlanStore } from '../../core/plan-store';
import { fmt12, fmtDur, taskTotal } from '../../shared/format';
import { pointOf } from '../../shared/point';
import { nowAndNext } from './now-pick';

/** The top of the page: the task on now (or next) and the next daily win, each one tap to check off. */
@Component({
  selector: 'app-now-card',
  imports: [MatCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = pick();
    <section class="panel" aria-labelledby="nowH">
      <h2 id="nowH" class="eyebrow">{{ p.live ? 'Now' : 'Next up' }}</h2>
      <div class="cols">
        <div class="slot">
          <!-- keyed on the item, so a fresh checkbox (unchecked) appears for each new one -->
          @for (t of p.now ? [p.now] : []; track t.id) {
            @if (t.locked) {
              <div class="fixed">
                <b>{{ t.title }}</b>
              </div>
            } @else {
              <mat-checkbox
                [checked]="false"
                [aria-label]="'Done: ' + t.title"
                (change)="store.toggleDone(t, $event.checked, pointOf($event))"
              >
                <b>{{ t.title }}</b>
              </mat-checkbox>
            }
            <small class="mono"
              >{{ t.start ? fmt12(t.start) : 'any time' }} · {{ fmtDur(total(t)) }}
              @if (p.next; as n) {
                · then {{ n.title }}
              }
            </small>
          } @empty {
            <b>Today's plan is done.</b>
            <small>Anything else is a bonus.</small>
          }
        </div>
        <div class="slot">
          @for (h of habit() ? [habit()!] : []; track h.id) {
            <mat-checkbox
              [checked]="false"
              [aria-label]="h.name"
              (change)="store.toggleHabit(h, $event.checked, pointOf($event))"
            >
              <b>{{ h.name }}</b>
            </mat-checkbox>
            <small>{{ habitsLeft() }} daily win{{ habitsLeft() > 1 ? 's' : '' }} left today</small>
          } @empty {
            @if (store.habits().length) {
              <b>Every daily win checked.</b>
            }
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './now-card.component.scss',
})
export class NowCardComponent {
  readonly store = inject(PlanStore);
  readonly fmt12 = fmt12;
  readonly fmtDur = fmtDur;
  readonly total = taskTotal;
  readonly pointOf = pointOf;

  private readonly minute = signal(this.nowMin());
  readonly pick = computed(() => {
    this.store.tasks();
    return nowAndNext(this.store.tasksOn(this.store.today), this.minute());
  });
  private readonly left = computed(() => {
    const marks = this.store.habitDays()[this.store.today] ?? {};
    return this.store.habits().filter((h) => !marks[h.id]);
  });
  readonly habit = computed(() => this.left()[0]);
  readonly habitsLeft = computed(() => this.left().length);

  constructor() {
    const timer = setInterval(() => this.minute.set(this.nowMin()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
  private nowMin() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
}
