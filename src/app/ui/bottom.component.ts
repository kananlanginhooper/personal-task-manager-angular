import { Component, computed, inject } from '@angular/core';
import { PlanStore } from '../store';
import { Change } from '../models';
import { DOW, MON, addDays, clock, fmt12, parseD } from '../util/dates';

const DESC: Record<string, string> = {
  move: 'Moved', estimate: 'New estimate', done: 'Done', undone: 'Unchecked', add: 'Added', split: 'Split', skip: 'Dropped',
  replan: 'Rebuilt', step: 'Step done', unstep: 'Step unchecked', habit: 'Habit', swap: 'Evening swap', shop: 'Shopping', edit: 'Edited', trophy: 'Trophy',
};

/** Reminders, recent wins + weekly budget, and the change log. */
@Component({
  selector: 'app-bottom',
  template: `
  <section class="panel" aria-labelledby="remH">
    <div class="panel-head"><h2 id="remH">Coming up</h2><span class="eyebrow">reminders</span></div>
    @for (t of reminders(); track t.id) {
      <div class="rem"><div class="when">{{ dow(t.date) }}<b>{{ md(t.date) }}</b></div><div><b>{{ t.title }}</b><small>{{ t.note || (t.start ? fmt12(t.start) : '') }}</small></div><span class="freq">{{ t.recurring ? 'repeats' : 'once' }}</span></div>
    } @empty { <div class="empty">No reminders coming up.</div> }
    <div class="eyebrow" style="margin-top:14px">Recurring</div>
    @for (r of store.recurring(); track r.id) {
      <div class="rem"><div class="when">{{ r.short }}</div><div><b>{{ r.title }}</b><small>{{ r.rule }}</small></div><span class="freq">{{ r.freq }}</span></div>
    }
  </section>

  <section class="panel" aria-labelledby="winsH">
    <div class="panel-head"><h2 id="winsH">Recent wins</h2><span class="eyebrow">the highlight reel</span></div>
    <div class="wins">
      @for (c of wins(); track $index) { <div class="win"><span class="star">★</span><div>{{ c.title }}<small>{{ clock(c.at) }}</small></div></div> }
      @empty { <div class="empty">Your first win will show up here. Small ones count.</div> }
    </div>
    <div class="eyebrow" style="margin-top:16px">Budget this week</div>
    <div class="money" style="margin-top:8px">
      @for (t of costs(); track t.id) { <div class="mrow"><span>{{ t.title }}</span><span>\${{ t.cost }}</span></div> }
      <div class="mrow" style="border-top:1px solid var(--line);padding-top:6px;font-weight:700"><span>Planned</span><span>\${{ costTotal() }}</span></div>
    </div>
  </section>

  <section class="panel" aria-labelledby="logH">
    <div class="panel-head"><h2 id="logH">Your changes</h2><span class="eyebrow">Claude reads this</span></div>
    <div class="log">
      @for (c of log(); track $index) { <div><time>{{ clock(c.at) }}</time><span><b>{{ desc[c.type] || c.type }}</b> {{ c.title }} <span class="muted">{{ detail(c) }}</span></span></div> }
      @empty { <div class="empty">No changes yet. When you move a task or change an estimate, it shows up here, and Claude reads it.</div> }
    </div>
  </section>
  `,
  host: { class: 'bottom' },
})
export class BottomComponent {
  readonly store = inject(PlanStore);
  readonly fmt12 = fmt12; readonly clock = clock; readonly desc = DESC;

  readonly reminders = computed(() => this.store.tasks().filter(t => t.remind && t.date >= this.store.today && !t.done && t.status !== 'skipped')
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6));
  readonly wins = computed(() => this.store.changes().filter(c => ['done', 'habit', 'step', 'swap', 'trophy'].includes(c.type)).slice(0, 6));
  readonly log = computed(() => this.store.changes().filter(c => !['habit', 'swap'].includes(c.type)).slice(0, 25));
  readonly costs = computed(() => {
    const days = [...Array(7)].map((_, i) => addDays(this.store.weekStart(), i));
    return this.store.tasks().filter(t => days.includes(t.date) && t.cost && t.status !== 'skipped');
  });
  readonly costTotal = computed(() => this.costs().reduce((a, t) => a + (t.cost ?? 0), 0));

  dow(d: string) { return DOW[parseD(d).getDay()].toUpperCase(); }
  md(d: string) { const x = parseD(d); return `${MON[x.getMonth()]} ${x.getDate()}`; }
  detail(c: Change): string {
    if (c.type === 'move' || c.type === 'replan') return `${c.from?.date?.slice(5) ?? ''} ${fmt12(c.from?.start)} → ${c.to?.date?.slice(5) ?? ''} ${fmt12(c.to?.start)}`;
    if (c.type === 'estimate') return `${c.from?.est} → ${c.to?.est} m${c.reason ? ` · “${c.reason}”` : ''}`;
    return c.reason ? `· “${c.reason}”` : '';
  }
}
