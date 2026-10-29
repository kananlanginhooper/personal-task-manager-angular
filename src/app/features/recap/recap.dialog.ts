import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { CelebrateService } from '../../core/celebrate.service';
import { PlanStore } from '../../core/plan-store';
import { DOW, MON, addDays, parseD } from '../../shared/format';

/** The Sunday recap: wins, streaks, trophies, what you taught the plan, and next week's focus. Data: the week's Monday. */
@Component({
  selector: 'app-recap',
  imports: [MatButton, MatDialogContent, MatDialogActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recap.dialog.html',
  styleUrl: './recap.dialog.scss',
})
export class RecapDialog {
  readonly store = inject(PlanStore);
  private readonly fx = inject(CelebrateService);
  private readonly ref = inject(MatDialogRef<RecapDialog>);
  readonly weekStart = inject<string>(MAT_DIALOG_DATA);

  readonly r = computed(() => {
    const s = this.store,
      today = s.today,
      ws = this.weekStart;
    const days = [...Array(7)].map((_, i) => addDays(ws, i));
    const inWeek = (x?: string | null) => !!x && days.includes(x.slice(0, 10));
    const hd = s.habitDays(),
      ids = s.habits().map((h) => h.id);
    const habitHits = days.reduce((a, d) => a + ids.filter((k) => hd[d]?.[k]).length, 0);
    const habitPossible = days.filter((d) => d <= today).length * ids.length;
    const wt = s
      .tasks()
      .filter((t) => days.includes(t.date) && t.status !== 'skipped' && !t.locked && !t.work);
    const done = wt.filter((t) => t.done).length;
    const bigs = s
      .tasks()
      .filter((t) => t.done && (t.big || t.dread) && (inWeek(t.doneAt) || days.includes(t.date)));
    const trophies = s.trophies().filter((t) => inWeek(s.awards()[t.id]?.earnedAt));
    const reest = s
      .tasks()
      .flatMap((t) =>
        (t.estHistory ?? []).filter((h) => inWeek(h.at)).map((h) => ({ title: t.title, ...h })),
      );
    const moved = s
      .tasks()
      .reduce((a, t) => a + (t.moves ?? []).filter((m) => inWeek(m.at)).length, 0);
    let best = { name: '', n: 0 };
    for (const h of s.habits()) {
      let n = 0,
        d = days[6] > today ? today : days[6];
      if (!hd[d]?.[h.id]) d = addDays(d, -1);
      while (hd[d]?.[h.id]) {
        n++;
        d = addDays(d, -1);
      }
      if (n > best.n) best = { name: h.name, n };
    }
    const focus = s
      .projects()
      .filter((p) => ['urgent', 'high'].includes(p.prio) && !p.steps.every((x) => x.done))
      .sort((a, b) => (a.prio === 'urgent' ? 0 : 1) - (b.prio === 'urgent' ? 0 : 1))
      .slice(0, 4)
      .map((p) => ({ title: p.title, next: p.next || p.steps.find((x) => !x.done)?.t }));
    const wins = habitHits + done;
    const verdict =
      wins >= 40
        ? 'That was a big week. Own it.'
        : wins >= 20
          ? 'Solid week. The habits are taking root.'
          : wins > 0
            ? 'You showed up. Next week, stack a few more.'
            : "A quiet week. That's allowed. Next week starts fresh.";
    const a = parseD(days[0]),
      b = parseD(days[6]);
    return {
      days,
      habitHits,
      habitPossible,
      planned: wt.length,
      done,
      ratio: wt.length ? Math.round((done / wt.length) * 100) : 0,
      bigs,
      trophies,
      reest,
      moved,
      best,
      focus,
      wins,
      verdict,
      range: `${MON[a.getMonth()]} ${a.getDate()} – ${MON[b.getMonth()]} ${b.getDate()}`,
    };
  });

  constructor() {
    try {
      localStorage.setItem('ptm-recap-' + this.weekStart, '1');
    } catch {
      /* storage blocked */
    }
    const r = this.r();
    this.store.saveRecap(this.weekStart, {
      wins: r.wins,
      habitHits: r.habitHits,
      habitPossible: r.habitPossible,
      tasksDone: r.done,
      tasksPlanned: r.planned,
      trophies: r.trophies.map((t) => t.id),
      reestimates: r.reest.length,
      moves: r.moved,
    });
    this.fx.chime(true);
    this.fx.fireworks(r.wins >= 20 ? 3200 : 1600);
  }

  dow(d: string) {
    return DOW[parseD(d).getDay()][0];
  }
  close(cheer = false) {
    this.ref.close();
    if (cheer) this.fx.cannons();
  }
}
