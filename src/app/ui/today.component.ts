import { Component, computed, inject } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { PlanStore, total } from '../store';
import { Task } from '../models';
import { fmt12, fmtDur, isWeekend, toMin } from '../util/dates';
import { pointOf } from './point';

/** Today's timeline. Drag rows by the grip to reorder or to another day in the week below. */
@Component({
  selector: 'app-today',
  imports: [CdkDropList, CdkDrag, CdkDragHandle],
  template: `
  <section class="panel" aria-labelledby="todayH">
    <div class="panel-head">
      <h2 id="todayH">Today's plan</h2>
      <button class="btn ghost small" type="button" (click)="store.editor.set({ date: store.today })">+ Add</button>
    </div>
    <div class="cap"><span class="mono">Evening</span><div class="capbar"><i [style.width.%]="pct()"></i></div><span class="mono">{{ pct() }} %</span></div>
    <div class="timeline" cdkDropList [cdkDropListData]="store.today" (cdkDropListDropped)="drop($event)">
      @if (workday(); as w) {
        <div class="row static"><span></span><time>{{ fmt12(w.start) }}</time>
          <div class="what"><i class="area-dot" [style.background]="store.areaColor()(w.area)"></i><span><b>{{ w.label }}</b><small>{{ w.sub }}</small></span></div>
          <span class="dur">{{ w.hours }} h</span></div>
      }
      @for (t of list(); track t.id; let i = $index) {
        @if (i === cutIndex()) {
        @if (boundary(); as b) {
          <div class="row boundary static"><span></span><time>{{ fmt12(b.time) }}</time>
            <div class="what"><i class="area-dot" style="background:var(--gold)"></i><span><b>{{ b.label }}</b><small>{{ b.sub }}</small></span></div><span class="dur">—</span></div>
        }
        }
        <div class="row" [class.done]="t.done" [class.fixed]="t.locked" cdkDrag [cdkDragData]="t" [cdkDragDisabled]="!!t.locked">
          @if (t.locked) { <span class="grip lock" title="Fixed event">•</span> } @else { <span class="grip" cdkDragHandle title="Drag to move" aria-label="Drag to move">⋮⋮</span> }
          <time>{{ t.start ? fmt12(t.start) : 'any' }}</time>
          <div class="what">
            @if (t.locked) { <i class="area-dot" [style.background]="store.areaColor()(t.area)"></i> }
            @else { <input type="checkbox" class="chk" [checked]="t.done" (change)="store.toggleDone(t, $any($event.target).checked, pointOf($event))" [attr.aria-label]="'Done: ' + t.title"> }
            <span (click)="store.editor.set({ task: t })">
              <b>{{ t.title }}</b>
              <small>{{ t.note || sub(t) }}@if (store.problems(t)[0]; as p) { <span class="flag"> · {{ p }}</span> }</small>
              @if (t.steps?.length) {
                <small>
                  @for (s of t.steps; track $index) {
                    <label style="display:inline-flex;gap:4px;align-items:center;margin-right:10px" (click)="$event.stopPropagation()">
                      <input type="checkbox" class="chk sm" [checked]="s.done" (change)="store.toggleTaskStep(t, $index, $any($event.target).checked, pointOf($event))">{{ s.t }}
                    </label>
                  }
                </small>
              }
            </span>
          </div>
          <span class="dur" [class.changed]="changed(t)" [title]="changed(t) ? 'Your estimate. Originally ' + t.origEst + ' m' : ''">{{ changed(t) ? t.origEst + '→' : '' }}{{ fmtDur(total(t)) }}</span>
        </div>
      }
      @if (cutIndex() >= list().length) {
        @if (boundary(); as b) {
          <div class="row boundary static"><span></span><time>{{ fmt12(b.time) }}</time>
            <div class="what"><i class="area-dot" style="background:var(--gold)"></i><span><b>{{ b.label }}</b><small>{{ b.sub }}</small></span></div><span class="dur">—</span></div>
        }
      }
      @if (!list().length) { <div class="empty">Nothing planned yet. Drag something here from the week, or add one.</div> }
    </div>
  </section>

  `,
})
export class TodayComponent {
  readonly store = inject(PlanStore);
  readonly fmt12 = fmt12; readonly fmtDur = fmtDur; readonly total = total; readonly pointOf = pointOf;

  readonly list = computed(() => { this.store.tasks(); return this.store.tasksOn(this.store.today); });
  readonly boundary = computed(() => this.store.settings().boundary);
  readonly workday = computed(() => (isWeekend(this.store.today) ? null : this.store.settings().workday ?? null));
  private readonly cut = computed(() => toMin(this.boundary()?.time) ?? 24 * 60);
  /** Index of the first task at or after the day's boundary time from settings. */
  readonly cutIndex = computed(() => { const i = this.list().findIndex(t => (toMin(t.start) ?? 1e4) >= this.cut()); return i < 0 ? this.list().length : i; });
  readonly pct = computed(() => {
    const evening = this.list().filter(t => !t.work && (!t.start || toMin(t.start)! >= 16 * 60 || isWeekend(this.store.today)));
    return Math.min(100, Math.round((evening.reduce((a, t) => a + total(t), 0) / this.store.capacityOf(this.store.today)) * 100));
  });

  changed(t: Task) { return !!t.origEst && t.est !== t.origEst; }
  sub(t: Task) {
    return [t.travel ? `${fmtDur(t.est)} + ${t.travel} m drive` : fmtDur(t.est || 0), t.leave ? `leave ${fmt12(t.leave)}` : '', t.cost ? `~$${t.cost}` : '']
      .filter(Boolean).join(' · ');
  }
  drop(e: CdkDragDrop<string, string, Task>) { dropInto(this.store, e); }
}

/** Shared drop handler: work out the new start time from the neighbours at the drop position. */
export function dropInto(store: PlanStore, e: CdkDragDrop<string, string, Task>) {
  const t = e.item.data, date = e.container.data;
  const order = store.tasksOn(date).filter(x => x.id !== t.id);
  const prev = order[e.currentIndex - 1], next = order[e.currentIndex];
  store.move(t, date, store.dropStart(t, date, prev, next));
}
