import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlanStore } from '../store';
import { addDays, clock, shortDate } from '../util/dates';

/** Free-text feedback for an assistant to read later. It replies on each note. */
@Component({
  selector: 'app-notes',
  imports: [FormsModule],
  template: `
  <section class="panel" aria-labelledby="notesH">
    <div class="panel-head"><h2 id="notesH">Notes for Claude</h2><span class="eyebrow">feedback, ideas, "this didn't work"</span></div>
    <form class="notes-form" (submit)="save($event)">
      <textarea id="noteText" name="noteText" [(ngModel)]="text" aria-label="Note for Claude"
        placeholder="e.g. Tuesdays are too full. This task takes 25 min, not 15. Add a reminder for something."></textarea>
      <div class="notes-row">
        <select id="noteAbout" name="noteAbout" [(ngModel)]="about" aria-label="About">
          <option value="">About: everything / general</option>
          @for (t of upcoming(); track t.id) { <option [value]="t.id">{{ shortDate(t.date) }} · {{ t.title }}</option> }
        </select>
        <button class="btn" type="submit">Save note</button>
      </div>
    </form>
    <div class="notes">
      @for (n of store.notes().slice(0, 12); track n.id) {
        <div class="note">
          <p>{{ n.text }}</p>
          <div class="meta">
            <span class="pill" [class.new]="n.status === 'new'" [class.read]="n.status !== 'new'">{{ n.status === 'new' ? 'Waiting for Claude' : 'Claude read this' }}</span>
            <span>{{ clock(n.at) }}</span>@if (n.taskTitle) { <span>· {{ n.taskTitle }}</span> }
          </div>
          @if (n.reply) { <div class="reply"><b>Claude:</b> {{ n.reply }}</div> }
        </div>
      } @empty { <div class="empty">Notes you leave here wait for Claude. Next time you talk, Claude reads them, adjusts the plan, and replies here.</div> }
    </div>
  </section>
  `,
})
export class NotesComponent {
  readonly store = inject(PlanStore);
  readonly shortDate = shortDate; readonly clock = clock;
  text = ''; about = '';
  readonly upcoming = computed(() => {
    const from = addDays(this.store.today, -3), to = addDays(this.store.today, 14);
    return this.store.tasks().filter(t => t.date >= from && t.date <= to && t.status !== 'skipped').sort((a, b) => a.date.localeCompare(b.date));
  });
  async save(e: Event) {
    e.preventDefault();
    if (!this.text.trim()) return;
    if (await this.store.addNote(this.text, this.about || null)) { this.text = ''; this.about = ''; }
  }
}
