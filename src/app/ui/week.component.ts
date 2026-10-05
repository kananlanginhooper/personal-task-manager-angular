import { Component, computed, inject } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { PlanStore, total } from '../store';
import { Task } from '../models';
import { DOW, MON, addDays, fmt12, fmtDur, parseD } from '../util/dates';
import { dropInto } from './today.component';

@Component({
  selector: 'app-week',
  imports: [CdkDropList, CdkDrag, CdkDragHandle],
  template: `
  <section class="panel" aria-labelledby="weekH">
    <div class="panel-head">
      <h2 id="weekH">This week</h2>
      <div class="weeknav">
        <button class="btn ghost small" type="button" (click)="shift(-7)" aria-label="Previous week">←</button>
        <span class="mono">{{ label() }}</span>
        <button class="btn ghost small" type="button" (click)="shift(7)" aria-label="Next week">→</button>
        <button class="btn small" type="button" (click)="add()">+ Add</button>
      </div>
    </div>
    <div class="week">
      @for (d of days(); track d.date) {
        <div class="day" [class.today]="d.date === store.today" cdkDropList [cdkDropListData]="d.date" (cdkDropListDropped)="drop($event)">
          <header><b>{{ d.dow }}</b><span>{{ d.label }}</span></header>
          <div class="daycap" [class.heavy]="d.pct > 70" [title]="d.pct + '% of free time planned'"><i [style.width.%]="d.pct"></i></div>
          @for (t of d.tasks; track t.id) {
            <div class="chip" [class.fixed]="t.locked" [class.call]="t.kind === 'call'" [class.done]="t.done" [class.warnc]="store.problems(t).length"
                 [style.--lc]="store.areaColor()(t.area)" cdkDrag [cdkDragData]="t" [cdkDragDisabled]="!!t.locked">
              @if (t.locked) { <span class="grip lock" title="Fixed event">•</span> } @else { <span class="grip" cdkDragHandle title="Drag to move" aria-label="Drag to move">⋮⋮</span> }
              <div class="t" (click)="store.editor.set({ task: t })">
                <span>{{ t.title }}</span>
                <small>{{ t.start ? fmt12(t.start) : 'any time' }} · @if (changed(t)) { <b>{{ t.origEst }}→{{ t.est }} m</b> } @else { {{ sub(t) }} }</small>
                @if (store.problems(t)[0]; as p) { <small style="color:var(--crit)">{{ p }}</small> }
              </div>
            </div>
          } @empty { <div class="empty" style="font-size:.78rem">Open evening</div> }
        </div>
      }
    </div>
  </section>
  `,
})
export class WeekComponent {
  readonly store = inject(PlanStore);
  readonly fmt12 = fmt12;

  readonly days = computed(() => {
    this.store.tasks();
    return [...Array(7)].map((_, i) => {
      const date = addDays(this.store.weekStart(), i), dt = parseD(date), tasks = this.store.tasksOn(date);
      const pct = Math.min(100, Math.round((tasks.reduce((a, t) => a + total(t), 0) / this.store.capacityOf(date)) * 100));
      return { date, tasks, pct, dow: DOW[dt.getDay()], label: `${MON[dt.getMonth()]} ${dt.getDate()}` };
    });
  });
  readonly label = computed(() => { const d = this.days(); return `${d[0].label} – ${d[6].label}`; });

  shift(n: number) { this.store.weekStart.update(w => addDays(w, n)); }
  add() { const w = this.store.weekStart(); this.store.editor.set({ date: w > this.store.today ? w : this.store.today }); }
  changed(t: Task) { return !!t.origEst && t.est !== t.origEst; }
  sub(t: Task) {
    return [t.travel ? `${fmtDur(t.est)} + ${t.travel} m drive` : fmtDur(t.est || 0), t.leave ? `leave ${fmt12(t.leave)}` : '', t.cost ? `~$${t.cost}` : '']
      .filter(Boolean).join(' · ');
  }
  drop(e: CdkDragDrop<string, string, Task>) { dropInto(this.store, e); }
}
