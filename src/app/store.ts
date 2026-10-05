import { Injectable, computed, inject, signal } from '@angular/core';
import { DataSource } from './data/data-source';
import { CelebrateService } from './celebrate.service';
import { Area, Award, Bootstrap, Change, HabitDef, Note, Project, RecurringRule, Settings, ShoppingItem, Task, TrophyDef } from './models';
import { addDays, fromMin, isWeekend, mondayOf, parseD, toMin, todayIso } from './util/dates';
import { TrophyFacts, progress } from './trophies';

export const total = (t: Task) => (t.est || 0) + (t.travel || 0);

/** Page state. Every action saves through the DataSource, then updates the signals. */
@Injectable({ providedIn: 'root' })
export class PlanStore {
  private ds = inject(DataSource);
  private fx = inject(CelebrateService);

  readonly mode = this.ds.mode;
  readonly today = todayIso();
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  readonly settings = signal<Settings>({});
  readonly areas = signal<Area[]>([]);
  readonly habits = signal<HabitDef[]>([]);
  readonly habitDays = signal<Record<string, Record<string, boolean>>>({});
  readonly tasks = signal<Task[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly shopping = signal<ShoppingItem[]>([]);
  readonly recurring = signal<RecurringRule[]>([]);
  readonly trophies = signal<TrophyDef[]>([]);
  readonly awards = signal<Record<string, Award>>({});
  readonly changes = signal<Change[]>([]);
  readonly notes = signal<Note[]>([]);
  readonly weekStart = signal(mondayOf(todayIso()));
  readonly freshTrophy = signal<string | null>(null);
  /** Open task editor: an existing task, or a new one on `date`. */
  readonly editor = signal<{ task?: Task; date?: string } | null>(null);
  /** Week start of the open recap, if any. */
  readonly recap = signal<string | null>(null);

  readonly facts = computed<TrophyFacts>(() => ({ habits: this.habits(), habitDays: this.habitDays(), tasks: this.tasks(), projects: this.projects() }));
  readonly areaColor = computed(() => {
    const map = new Map(this.areas().map(a => [a.id, a.color]));
    return (id?: string | null) => (id && map.get(id)) || '#1E6A50';
  });
  readonly overdue = computed(() => this.tasks().filter(t => t.date < this.today && !t.done && !t.locked && t.status !== 'skipped'));

  async load() {
    try {
      const b: Bootstrap = await this.ds.bootstrap();
      this.settings.set(b.settings ?? {}); this.areas.set(b.areas); this.habits.set(b.habits); this.habitDays.set(b.habitDays);
      this.tasks.set(b.tasks); this.projects.set(b.projects); this.shopping.set(b.shopping); this.recurring.set(b.recurring);
      this.trophies.set(b.trophies); this.awards.set(b.awards); this.changes.set(b.changes); this.notes.set(b.notes);
      this.loaded.set(true);
      document.title = b.settings?.appTitle || 'Game Plan';
      this.checkTrophies(false);
    } catch (e: any) {
      this.error.set(`Couldn't load your plan (${e?.message ?? e}). Is the API running?`);
    }
  }

  // ------------------------------------------------------------ queries
  tasksOn(date: string): Task[] {
    return this.tasks().filter(t => t.date === date && t.status !== 'skipped')
      .sort((a, b) => (toMin(a.start) ?? 1e4) - (toMin(b.start) ?? 1e4) || a.title.localeCompare(b.title));
  }
  capacityOf(date: string): number {
    const c = this.settings().capacity;
    return isWeekend(date) ? (c?.weekendMinutes ?? 600) : (c?.weekdayMinutes ?? 285);
  }
  dayStart(date: string): number {
    const c = this.settings().capacity;
    return toMin(isWeekend(date) ? c?.weekendStart ?? '09:00' : c?.weekdayStart ?? '17:15')!;
  }
  problems(t: Task): string[] {
    const out: string[] = [];
    if (t.closeBy && t.start) {
      const arrive = toMin(t.start)! + (t.travel || 0) / 2, leave = arrive + (t.est || 0);
      if (leave > toMin(t.closeBy)!) out.push(`Closes at ${t.closeBy}. This plan has you there until ${fromMin(Math.round(leave))}.`);
      if (!isWeekend(t.date) && toMin(t.start)! >= 17 * 60) out.push("Weekday evenings don't work: it closes before you'd get there.");
    }
    return out;
  }
  streak(habit: string): number {
    const hd = this.habitDays();
    let n = 0, d = hd[this.today]?.[habit] ? this.today : addDays(this.today, -1);
    while (hd[d]?.[habit]) { n++; d = addDays(d, -1); }
    return n;
  }

  // ------------------------------------------------------------ helpers
  private replaceTask(t: Task) { this.tasks.update(list => list.map(x => (x.id === t.id ? t : x))); }
  private async refreshChanges() { try { this.changes.set(await this.ds.changes(80)); } catch { /* keep old */ } }
  private async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try { const r = await fn(); this.refreshChanges(); setTimeout(() => this.checkTrophies(true), 60); return r; }
    catch (e: any) { this.fx.note(`Couldn't save that change (${e?.message ?? 'error'}). Try again in a moment.`); return undefined; }
  }

  // ------------------------------------------------------------ actions
  async toggleDone(t: Task, done: boolean, at: { x: number; y: number }) {
    const r = await this.run(() => this.ds.setDone(t.id, done));
    if (!r) return;
    this.replaceTask(r);
    if (done) {
      const tax = this.settings().taxCheer;
      const msg = r.cheer || (tax && new RegExp(tax.match, 'i').test(r.title) ? tax.msg : `${r.title}: done.`);
      this.fx.celebrate(msg, at, !!(r.big || r.dread), r.hype ?? undefined);
    }
  }
  async toggleTaskStep(t: Task, i: number, done: boolean, at: { x: number; y: number }) {
    const r = await this.run(() => this.ds.setTaskStep(t.id, i, done));
    if (!r) return;
    this.replaceTask(r);
    if (done) this.fx.celebrate(i === 0 && r.closeBy ? 'You went. Getting there was the whole win. Anything after is bonus.' : `${r.steps?.[i]?.t}. Nice.`, at, i === 0);
  }
  async toggleProjectStep(p: Project, i: number, done: boolean, at: { x: number; y: number }) {
    const r = await this.run(() => this.ds.setProjectStep(p.id, i, done));
    if (!r) return;
    this.projects.update(list => list.map(x => (x.id === r.id ? r : x)));
    if (done) {
      const all = r.steps.every(s => s.done);
      this.fx.celebrate(all ? `${r.title}: every step done. Huge.` : `One step closer: ${r.steps[i].t}`, at, all || r.prio === 'urgent');
    }
  }
  async toggleHabit(h: HabitDef, done: boolean, at: { x: number; y: number }) {
    const marks = await this.run(() => this.ds.markHabit(this.today, h.id, done));
    if (!marks) return;
    this.habitDays.update(d => ({ ...d, [this.today]: marks }));
    if (!done) return;
    const s = this.streak(h.id), all = this.habits().every(x => marks[x.id]);
    if (all) this.fx.celebrate('Every daily win checked. A perfect day.', at, true, 'PERFECT DAY.');
    else if ([3, 7, 14, 21, 30].includes(s)) this.fx.celebrate(`${h.name}: ${s} days in a row.`, at, true, `${s}-DAY STREAK!`);
    else this.fx.celebrate(h.cheer || `${h.name}: done.`, at, !!h.big, h.hype ?? undefined);
  }
  async move(t: Task, date: string, start: string | null, type = 'move', reason?: string | null) {
    if (t.date === date && (t.start ?? null) === (start ?? null)) return;
    const r = await this.run(() => this.ds.moveTask(t.id, date, start, type, reason));
    if (!r) return;
    this.replaceTask(r);
    const p = this.problems(r);
    if (p.length) this.fx.note(p[0]);
  }
  /** Work out a start time from the neighbours at the drop position. */
  dropStart(t: Task, date: string, prev?: Task, next?: Task): string {
    const floor = this.dayStart(date);
    let start: number;
    if (prev?.start) start = toMin(prev.start)! + total(prev);
    else if (next?.start) start = Math.max(floor, toMin(next.start)! - total(t));
    else start = toMin(t.start) ?? floor;
    if (t.closeBy && isWeekend(date) && !prev) start = Math.min(start, 11 * 60);
    return fromMin(Math.min(Math.round(start / 5) * 5, 23 * 60));
  }
  async saveEdit(t: Task, v: { title: string; date: string; start: string | null; est: number; area: string | null; reason: string; note: string }) {
    if (v.note.trim()) await this.addNote(v.note, t.id, true);
    const patch: { title?: string; area?: string | null } = {};
    if (v.title !== t.title) patch.title = v.title;
    if (v.area !== (t.area ?? null)) patch.area = v.area;
    let cur: Task | undefined = t;
    if (Object.keys(patch).length) { cur = await this.run(() => this.ds.patchTask(t.id, patch)); if (cur) this.replaceTask(cur); }
    if (cur && v.est !== cur.est) { cur = await this.run(() => this.ds.setEstimate(t.id, v.est, v.reason || null)); if (cur) this.replaceTask(cur); }
    if (cur) await this.move(cur, v.date, v.start, 'move', v.reason || null);
  }
  async addTask(v: { title: string; date: string; start: string | null; est: number; area: string | null; note: string }) {
    const r = await this.run(() => this.ds.addTask({ title: v.title, date: v.date, start: v.start, est: v.est, area: v.area }));
    if (!r) return;
    this.tasks.update(l => [...l, r]);
    if (v.note.trim()) await this.addNote(v.note, r.id, true);
    this.fx.note(`${r.title} is on the plan.`, 'Added', '+');
  }
  async split(t: Task, reason: string) {
    const r = await this.run(() => this.ds.splitTask(t.id, reason || 'split by hand'));
    if (!r) return;
    this.tasks.update(l => [...l.map(x => (x.id === r[0].id ? r[0] : x)), r[1]]);
    this.fx.note('Two smaller pieces. Part 2 is on the next day; drag it wherever it fits.', 'Split', '½');
  }
  async skip(t: Task, reason: string) {
    const r = await this.run(() => this.ds.skipTask(t.id, reason));
    if (r) this.replaceTask(r);
  }
  /** Move each missed task to the lightest upcoming evening; split anything over 30 minutes first. */
  async rebuild(at: { x: number; y: number }) {
    const load: Record<string, number> = {};
    for (let i = 0; i < 7; i++) { const d = addDays(this.today, i); load[d] = this.tasksOn(d).reduce((a, t) => a + total(t), 0); }
    for (const t0 of this.overdue()) {
      let t = t0;
      let cands = Object.keys(load);
      if (t.closeBy) cands = cands.filter(isWeekend);
      if (!cands.length) cands = [addDays(mondayOf(this.today), 13)];
      const best = cands.sort((a, b) => load[a] / this.capacityOf(a) - load[b] / this.capacityOf(b))[0];
      if (t.est > 30 && !t.closeBy) {
        const r = await this.run(() => this.ds.splitTask(t.id, 'rebuild: big task split'));
        if (r) { this.tasks.update(l => [...l.map(x => (x.id === r[0].id ? r[0] : x)), r[1]]); t = r[0]; }
      }
      const last = this.tasksOn(best).filter(x => x.start).reduce((m, x) => Math.max(m, toMin(x.start)! + total(x)), this.dayStart(best) + 15);
      const start = t.closeBy ? '11:00' : fromMin(Math.round(last / 5) * 5);
      await this.move(t, best, start, 'replan', 'missed its day');
      load[best] = (load[best] ?? 0) + total(t);
    }
    this.fx.celebrate('Week rebuilt. Re-planning is the skill, not failure.', at, false);
  }
  async addShopping(item: string) {
    const r = await this.run(() => this.ds.addShopping(item));
    if (r) this.shopping.update(l => [...l, r]);
  }
  async setNeed(i: ShoppingItem, need: boolean, at?: { x: number; y: number }) {
    const r = await this.run(() => this.ds.setShoppingNeed(i.id, need));
    if (!r) return;
    this.shopping.update(l => l.map(x => (x.id === r.id ? r : x)));
    if (!need && at) this.fx.celebrate(`Got the ${r.item}.`, at, false);
  }
  async eveningSwap(label: string, msg: string, at: { x: number; y: number }) {
    this.fx.celebrate(msg, at, true);
    await this.run(() => this.ds.addChange({ type: 'swap', title: `${label} ${this.settings().evening?.suffix ?? ''}`.trim() }));
  }
  async addNote(text: string, taskId?: string | null, quiet = false) {
    const r = await this.run(() => this.ds.addNote(text.trim(), taskId));
    if (!r) return false;
    this.notes.update(l => [r, ...l]);
    if (!quiet) this.fx.note('Claude will read this next time and reply here.', 'Saved', '✎');
    return true;
  }
  async saveRecap(weekStart: string, data: unknown) { try { await this.ds.saveRecap(weekStart, data); } catch { /* not critical */ } }

  // ------------------------------------------------------------ trophies
  checkTrophies(announce: boolean) {
    if (!this.loaded()) return;
    const f = this.facts();
    const fresh = this.trophies().filter(t => !this.awards()[t.id] && progress(t.rule, f) >= t.goal);
    fresh.forEach((t, i) => {
      const local: Award = { id: t.id, name: t.name, earnedAt: new Date().toISOString() };
      this.awards.update(a => ({ ...a, [t.id]: local }));
      this.ds.award(t.id, t.name).then(a => this.awards.update(x => ({ ...x, [t.id]: a }))).catch(() => {});
      if (announce) {
        setTimeout(() => {
          this.freshTrophy.set(t.id);
          this.fx.celebrate(`${t.desc}. It's on your shelf now.`, { x: innerWidth / 2, y: innerHeight / 2 }, true, `TROPHY UNLOCKED: ${t.name.toUpperCase()}`);
          setTimeout(() => this.freshTrophy.set(null), 6000);
        }, 2200 + i * 4600);
      }
    });
  }

  recapWeek(): string {
    const d = parseD(this.today).getDay();
    return d === 1 && new Date().getHours() < 12 ? addDays(mondayOf(this.today), -7) : mondayOf(this.today);
  }
}
