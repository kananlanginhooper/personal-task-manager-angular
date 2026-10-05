import { Injectable } from '@angular/core';
import { DataSource } from './data-source';
import { demoSeed } from './demo-seed';
import { Award, Bootstrap, Change, Note, Project, ShoppingItem, Task } from '../models';
import { addDays } from '../util/dates';

const KEY = 'ptm-demo-v1';

/** Runs the whole app in the browser with sample data. Changes stay in this browser only. */
@Injectable()
export class DemoDataSource extends DataSource {
  readonly mode = 'demo' as const;
  private db: Bootstrap = this.load();
  private seq = 0;

  private load(): Bootstrap {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* storage blocked */ }
    return demoSeed();
  }
  private save() { try { localStorage.setItem(KEY, JSON.stringify(this.db)); } catch { /* storage blocked */ } }
  static reset() { try { localStorage.removeItem(KEY); } catch { /* storage blocked */ } }

  private id() { return `d${Date.now().toString(36)}${(++this.seq).toString(36)}`; }
  private now() { return new Date().toISOString(); }
  private task(id: string): Task {
    const t = this.db.tasks.find(x => x.id === id);
    if (!t) throw new Error('No such task');
    return t;
  }
  private log(c: Omit<Change, 'at'>): Change {
    const entry = { at: this.now(), ...c, id: this.id() };
    this.db.changes = [entry, ...this.db.changes].slice(0, 300);
    return entry;
  }
  private done<T>(v: T): Promise<T> { this.save(); return Promise.resolve(structuredClone(v)); }

  bootstrap() { return Promise.resolve(structuredClone(this.db)); }

  addTask(p: Parameters<DataSource['addTask']>[0]) {
    const t: Task = { id: this.id(), ...p, origEst: p.est, done: false } as Task;
    this.db.tasks.push(t);
    this.log({ type: 'add', title: t.title, taskId: t.id, to: { date: t.date, start: t.start, est: t.est } });
    return this.done(t);
  }
  patchTask(id: string, patch: { title?: string; area?: string | null }) {
    const t = this.task(id); const before = { title: t.title, area: t.area };
    Object.assign(t, patch);
    this.log({ type: 'edit', title: t.title, taskId: id, from: before, to: patch });
    return this.done(t);
  }
  setDone(id: string, done: boolean) {
    const t = this.task(id); t.done = done; t.doneAt = done ? this.now() : null;
    this.log({ type: done ? 'done' : 'undone', title: t.title, taskId: id });
    return this.done(t);
  }
  setTaskStep(id: string, i: number, done: boolean) {
    const t = this.task(id); t.steps = (t.steps ?? []).map((s, k) => (k === i ? { ...s, done } : s));
    if (t.steps.every(s => s.done)) { t.done = true; t.doneAt = this.now(); }
    this.log({ type: done ? 'step' : 'unstep', title: `${t.title}: ${t.steps[i]?.t}`, taskId: id });
    return this.done(t);
  }
  moveTask(id: string, date: string, start: string | null, type: string, reason?: string | null) {
    const t = this.task(id); const from = { date: t.date, start: t.start }; const to = { date, start };
    t.date = date; t.start = start; t.moves = [...(t.moves ?? []), { at: this.now(), from, to, type }];
    this.log({ type, title: t.title, taskId: id, from, to, reason });
    return this.done(t);
  }
  setEstimate(id: string, est: number, reason?: string | null) {
    const t = this.task(id);
    t.origEst = t.origEst ?? t.est;
    t.estHistory = [...(t.estHistory ?? []), { at: this.now(), from: t.est, to: est, reason }];
    this.log({ type: 'estimate', title: t.title, taskId: id, from: { est: t.est }, to: { est }, reason });
    t.est = est;
    return this.done(t);
  }
  splitTask(id: string, reason?: string | null) {
    const t = this.task(id); const base = t.title.replace(/ \(part \d\)$/, '');
    const half = Math.max(5, Math.round(t.est / 2 / 5) * 5);
    t.origEst = t.origEst ?? t.est;
    const second: Task = { ...structuredClone(t), id: this.id(), title: `${base} (part 2)`, est: Math.max(5, t.est - half), start: null,
      done: false, moves: [], splitFrom: t.id, date: addDays(t.date, 1) };
    t.title = `${base} (part 1)`; t.est = half;
    this.db.tasks.push(second);
    this.log({ type: 'split', title: base, taskId: id, from: { est: t.origEst }, to: { est: [t.est, second.est] }, reason });
    return this.done([t, second] as [Task, Task]);
  }
  skipTask(id: string, reason?: string | null) {
    const t = this.task(id); t.status = 'skipped';
    this.log({ type: 'skip', title: t.title, taskId: id, reason });
    return this.done(t);
  }
  setProjectStep(id: string, i: number, done: boolean) {
    const p = this.db.projects.find(x => x.id === id) as Project;
    p.steps = p.steps.map((s, k) => (k === i ? { ...s, done } : s));
    this.log({ type: done ? 'step' : 'unstep', title: `${p.title}: ${p.steps[i].t}`, projectId: id });
    return this.done(p);
  }
  markHabit(date: string, habit: string, done: boolean) {
    const marks = { ...(this.db.habitDays[date] ?? {}), [habit]: done };
    this.db.habitDays[date] = marks;
    if (done) this.log({ type: 'habit', title: this.db.habits.find(h => h.id === habit)?.name ?? habit });
    return this.done(marks);
  }
  addShopping(item: string) {
    const row: ShoppingItem = { id: this.id(), item, need: true, stocked: false };
    this.db.shopping.push(row); this.log({ type: 'shop', title: `Added ${item}` });
    return this.done(row);
  }
  setShoppingNeed(id: string, need: boolean) {
    const row = this.db.shopping.find(x => x.id === id) as ShoppingItem; row.need = need;
    return this.done(row);
  }
  addChange(c: { type: string; title?: string; reason?: string; extra?: unknown }) { return this.done(this.log(c)); }
  changes(limit = 80) { return Promise.resolve(structuredClone(this.db.changes.slice(0, limit))); }
  addNote(text: string, taskId?: string | null) {
    const note: Note = { id: this.id(), at: this.now(), text, taskId: taskId ?? null,
      taskTitle: taskId ? this.db.tasks.find(t => t.id === taskId)?.title ?? null : null, status: 'new' };
    this.db.notes = [note, ...this.db.notes];
    return this.done(note);
  }
  award(id: string, name: string) {
    const a: Award = this.db.awards[id] ?? { id, name, earnedAt: this.now() };
    this.db.awards[id] = a; this.log({ type: 'trophy', title: `Trophy: ${name}` });
    return this.done(a);
  }
  saveRecap() { this.save(); return Promise.resolve(); }
}
