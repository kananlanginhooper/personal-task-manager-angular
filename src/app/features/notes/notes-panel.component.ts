import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { PlanStore } from '../../core/plan-store';
import { CardComponent } from '../../shared/card/card.component';
import { addDays, clock, shortDate } from '../../shared/format';

/** Free-text feedback for an assistant to read later. It replies on each note. */
@Component({
  selector: 'app-notes-panel',
  imports: [
    FormsModule,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    CardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notes-panel.component.html',
  styleUrl: './notes-panel.component.scss',
})
export class NotesPanelComponent {
  readonly store = inject(PlanStore);
  readonly shortDate = shortDate;
  readonly clock = clock;
  readonly text = signal('');
  readonly about = signal('');

  /** tasks from 3 days ago to 2 weeks out, to pick what a note is about */
  readonly upcoming = computed(() => {
    const from = addDays(this.store.today, -3),
      to = addDays(this.store.today, 14);
    return this.store
      .tasks()
      .filter((t) => t.date >= from && t.date <= to && t.status !== 'skipped')
      .sort((a, b) => a.date.localeCompare(b.date));
  });

  async save(e: Event) {
    e.preventDefault();
    if (!this.text().trim()) return;
    if (await this.store.addNote(this.text(), this.about() || null)) {
      this.text.set('');
      this.about.set('');
    }
  }
}
