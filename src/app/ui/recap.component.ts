import { Component, computed, effect, inject, untracked } from '@angular/core';
import { PlanStore } from '../store';
import { CelebrateService } from '../celebrate.service';
import { DOW, MON, addDays, parseD } from '../util/dates';

/** The Sunday recap: wins, streaks, trophies, what you taught the plan, and next week's focus. */
@Component({
  selector: 'app-recap',
  template: `
  @if (r(); as r) {
    <div class="overlay" (click)="close()">
      <div class="modal recap" role="dialog" aria-modal="true" aria-labelledby="recapTitle" (click)="$event.stopPropagation()">
        <div class="recap-head">
          <div class="eyebrow">Sunday recap · {{ r.range }}</div>
          <div class="recap-big" id="recapTitle">{{ r.wins }} wins</div><div>{{ r.verdict }}</div>
        </div>
        <div class="tiles">
          <div class="tile"><b>{{ r.habitHits }}</b><small>daily wins of {{ r.habitPossible }}</small></div>
          <div class="tile"><b>{{ r.done }}/{{ r.planned }}</b><small>planned tasks done ({{ r.ratio }} %)</small></div>
          <div class="tile"><b>{{ r.trophies.length }}</b><small>new trophies</small></div>
          <div class="tile"><b>{{ r.best.n || '–' }}</b><small>{{ r.best.n ? 'day streak: ' + r.best.name : 'streak to start' }}</small></div>
        </div>
        <div class="heat"><table>
          <thead><tr><th></th>@for (d of r.days; track d) { <th>{{ dow(d) }}</th> }</tr></thead>
          <tbody>@for (h of store.habits(); track h.id) {
            <tr><td class="n">{{ h.name }}</td>@for (d of r.days; track d) { <td class="c" [class.on]="store.habitDays()[d]?.[h.id]" [title]="d"></td> }</tr>
          }</tbody>
        </table></div>
        <div class="rcols">
          <div>
            <h4>Biggest wins</h4>
            @if (r.bigs.length) { <ul>@for (t of r.bigs; track t.id) { <li>{{ t.title }}</li> }</ul> }
            @else { <div class="empty">The hard ones show up here.</div> }
            @if (r.trophies.length) { <h4 style="margin-top:12px">Trophies earned</h4><ul>@for (t of r.trophies; track t.id) { <li>{{ t.name }}</li> }</ul> }
          </div>
          <div>
            <h4>What you taught the plan</h4>
            @if (r.reest.length || r.moved) {
              <ul>
                @for (h of r.reest; track $index) { <li>{{ h.title }}: {{ h.from }}→{{ h.to }} m@if (h.reason) { ({{ h.reason }}) }</li> }
                @if (r.moved) { <li>{{ r.moved }} task{{ r.moved > 1 ? 's' : '' }} moved to a better slot</li> }
              </ul>
              <div class="muted" style="font-size:.82rem;margin-top:6px">Claude uses these to size next week.</div>
            } @else { <div class="empty">No estimates changed. If something ran long, click it and fix the time.</div> }
            <h4 style="margin-top:12px">Next week's focus</h4>
            <ul>@for (f of r.focus; track f.title) { <li><b>{{ f.title }}</b>@if (f.next) {: {{ f.next }}}</li> }</ul>
          </div>
        </div>
        <div class="mbtns"><span></span><button class="btn" type="button" (click)="close(true)">Let's go, next week</button></div>
      </div>
    </div>
  }
  `,
})
export class RecapComponent {
  readonly store = inject(PlanStore);
  private fx = inject(CelebrateService);

  constructor() {
    effect(() => {
      const ws = this.store.recap();
      if (!ws) return;
      try { localStorage.setItem('ptm-recap-' + ws, '1'); } catch { /* storage blocked */ }
      const r = untracked(() => this.r());
      if (!r) return;
      untracked(() => this.store.saveRecap(ws, { wins: r.wins, habitHits: r.habitHits, habitPossible: r.habitPossible, tasksDone: r.done, tasksPlanned: r.planned,
        trophies: r.trophies.map(t => t.id), reestimates: r.reest.length, moves: r.moved }));
      this.fx.chime(true); this.fx.fireworks(r.wins >= 20 ? 3200 : 1600);
    });
  }

  dow(d: string) { return DOW[parseD(d).getDay()][0]; }
  close(cheer = false) { this.store.recap.set(null); if (cheer) this.fx.cannons(); }

  readonly r = computed(() => {
    const ws = this.store.recap();
    if (!ws) return null;
    const s = this.store, today = s.today;
    const days = [...Array(7)].map((_, i) => addDays(ws, i));
    const inWeek = (x?: string | null) => !!x && days.includes(x.slice(0, 10));
    const hd = s.habitDays(), ids = s.habits().map(h => h.id);
    const habitHits = days.reduce((a, d) => a + ids.filter(k => hd[d]?.[k]).length, 0);
    const habitPossible = days.filter(d => d <= today).length * ids.length;
    const wt = s.tasks().filter(t => days.includes(t.date) && t.status !== 'skipped' && !t.locked && !t.work);
    const done = wt.filter(t => t.done).length;
    const bigs = s.tasks().filter(t => t.done && (t.big || t.dread) && (inWeek(t.doneAt) || days.includes(t.date)));
    const trophies = s.trophies().filter(t => inWeek(s.awards()[t.id]?.earnedAt));
    const reest = s.tasks().flatMap(t => (t.estHistory ?? []).filter(h => inWeek(h.at)).map(h => ({ title: t.title, ...h })));
    const moved = s.tasks().reduce((a, t) => a + (t.moves ?? []).filter(m => inWeek(m.at)).length, 0);
    let best = { name: '', n: 0 };
    for (const h of s.habits()) {
      let n = 0, d = days[6] > today ? today : days[6];
      if (!hd[d]?.[h.id]) d = addDays(d, -1);
      while (hd[d]?.[h.id]) { n++; d = addDays(d, -1); }
      if (n > best.n) best = { name: h.name, n };
    }
    const focus = s.projects().filter(p => ['urgent', 'high'].includes(p.prio) && !p.steps.every(x => x.done))
      .sort((a, b) => (a.prio === 'urgent' ? 0 : 1) - (b.prio === 'urgent' ? 0 : 1)).slice(0, 4)
      .map(p => ({ title: p.title, next: p.next || p.steps.find(x => !x.done)?.t }));
    const wins = habitHits + done;
    const verdict = wins >= 40 ? 'That was a big week. Own it.' : wins >= 20 ? 'Solid week. The habits are taking root.'
      : wins > 0 ? 'You showed up. Next week, stack a few more.' : "A quiet week. That's allowed. Next week starts fresh.";
    const a = parseD(days[0]), b = parseD(days[6]);
    return { days, habitHits, habitPossible, planned: wt.length, done, ratio: wt.length ? Math.round((done / wt.length) * 100) : 0,
      bigs, trophies, reest, moved, best, focus, wins, verdict, range: `${MON[a.getMonth()]} ${a.getDate()} – ${MON[b.getMonth()]} ${b.getDate()}` };
  });
}
