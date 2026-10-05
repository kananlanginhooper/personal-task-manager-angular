import { Component, computed, effect, inject, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlanStore } from '../store';

/** Add a task, or change one: time, your own estimate (with why), area, a note for Claude, split, or drop. */
@Component({
  selector: 'app-editor',
  imports: [FormsModule],
  template: `
  @if (store.editor(); as ed) {
    <div class="overlay" (click)="close()" (keydown.escape)="close()">
      <form class="modal" (click)="$event.stopPropagation()" (submit)="save($event)" aria-labelledby="editH">
        <h3 id="editH">{{ ed.task ? 'Change task' : 'Add a task' }}</h3>
        <div class="fgrid">
          <label class="field full">Task<input type="text" id="fTitle" name="title" [(ngModel)]="f.title" required></label>
          <label class="field">Day<input type="date" id="fDate" name="date" [(ngModel)]="f.date" required></label>
          <label class="field">Start<input type="time" id="fStart" name="start" [(ngModel)]="f.start"></label>
          <label class="field">Your estimate (min)<input type="number" id="fEst" name="est" min="5" step="5" [(ngModel)]="f.est" required></label>
          <label class="field">Area<select id="fArea" name="area" [(ngModel)]="f.area">@for (a of store.areas(); track a.id) { <option [value]="a.id">{{ a.name }}</option> }</select></label>
          <label class="field full">Note for Claude <span class="muted" style="font-weight:400">(optional, read later as feedback)</span>
            <textarea id="fNote" name="note" [(ngModel)]="f.note" placeholder="anything about this task: it's bigger than it looks, it needs a part first…"></textarea></label>
          @if (ed.task) {
            <label class="field full">Why the change? <span class="muted" style="font-weight:400">(helps Claude re-plan)</span>
              <textarea id="fReason" name="reason" [(ngModel)]="f.reason" placeholder="e.g. took 40 min last time, this is really two jobs"></textarea></label>
          }
        </div>
        @if (hint()) { <div class="hint">{{ hint() }}</div> }
        <div class="mbtns">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            @if (ed.task && !ed.task.locked) {
              <button class="btn ghost small" type="button" (click)="split()">Split in two</button>
              <button class="btn ghost small" type="button" (click)="skip()">Not doing this</button>
            }
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn ghost" type="button" (click)="close()">Cancel</button>
            <button class="btn" type="submit">Save</button>
          </div>
        </div>
      </form>
    </div>
  }
  `,
})
export class EditorComponent {
  readonly store = inject(PlanStore);
  f = { title: '', date: '', start: '', est: 15, area: '', note: '', reason: '' };

  constructor() {
    effect(() => {
      const ed = this.store.editor();
      if (!ed) return;
      const t = ed.task;
      this.f = { title: t?.title ?? '', date: t?.date ?? ed.date ?? this.store.today, start: t?.start ?? '', est: t?.est ?? 15,
        area: t?.area ?? untracked(() => this.store.areas()[0]?.id) ?? '', note: '', reason: '' };
      setTimeout(() => document.getElementById('fTitle')?.focus());
    });
  }

  readonly hint = computed(() => {
    const t = this.store.editor()?.task;
    if (!t) return 'Estimates are your best guess. Change them anytime.';
    const bits: string[] = [];
    if (t.origEst) bits.push(`Original estimate ${t.origEst} m${t.estHistory?.length ? `, changed ${t.estHistory.length}×` : ''}. Your change is saved alongside it, never over it.`);
    if (t.travel) bits.push(`Plus ${t.travel} m round-trip drive (added automatically).`);
    if (t.closeBy) bits.push(`Closes at ${t.closeBy}. Plan around that.`);
    return bits.join(' ');
  });

  close() { this.store.editor.set(null); }

  async save(e: Event) {
    e.preventDefault();
    const ed = this.store.editor();
    if (!ed || !this.f.title.trim() || !this.f.date) return;
    const v = { title: this.f.title.trim(), date: this.f.date, start: this.f.start || null, est: Math.max(5, Number(this.f.est) || 15),
      area: this.f.area || null, note: this.f.note, reason: this.f.reason.trim() };
    this.close();
    if (ed.task) await this.store.saveEdit(ed.task, v);
    else await this.store.addTask(v);
  }
  split() { const t = this.store.editor()?.task; if (t) { this.close(); this.store.split(t, this.f.reason.trim()); } }
  skip() { const t = this.store.editor()?.task; if (t) { this.close(); this.store.skip(t, this.f.reason.trim()); } }
}
