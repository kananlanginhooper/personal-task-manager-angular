import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { PlanStore } from '../../core/plan-store';
import { Task } from '../../core/models';

export interface EditorData {
  task?: Task;
  date?: string;
}

/** Add a task, or change one: time, your own estimate (with why), area, a note for Claude, split, or drop. */
@Component({
  selector: 'app-task-editor',
  imports: [
    FormsModule,
    MatButton,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    MatSelect,
    MatOption,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-editor.dialog.html',
  styleUrl: './task-editor.dialog.scss',
})
export class TaskEditorDialog {
  readonly store = inject(PlanStore);
  readonly data = inject<EditorData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<TaskEditorDialog>);
  readonly task = this.data.task;

  readonly f = {
    title: this.task?.title ?? '',
    date: this.task?.date ?? this.data.date ?? this.store.today,
    start: this.task?.start ?? '',
    est: this.task?.est ?? 15,
    area: this.task?.area ?? this.store.areas()[0]?.id ?? '',
    note: '',
    reason: '',
  };

  readonly hint = (() => {
    const t = this.task;
    if (!t) return 'Estimates are your best guess. Change them anytime.';
    const bits: string[] = [];
    if (t.origEst)
      bits.push(
        `Original estimate ${t.origEst} m${t.estHistory?.length ? `, changed ${t.estHistory.length}×` : ''}. Your change is saved alongside it, never over it.`,
      );
    if (t.travel) bits.push(`Plus ${t.travel} m round-trip drive (added automatically).`);
    if (t.closeBy) bits.push(`Closes at ${t.closeBy}. Plan around that.`);
    return bits.join(' ');
  })();

  async save(e: Event) {
    e.preventDefault();
    if (!this.f.title.trim() || !this.f.date) return;
    const v = {
      title: this.f.title.trim(),
      date: this.f.date,
      start: this.f.start || null,
      est: Math.max(5, Number(this.f.est) || 15),
      area: this.f.area || null,
      note: this.f.note,
      reason: this.f.reason.trim(),
    };
    this.ref.close();
    if (this.task) await this.store.saveEdit(this.task, v);
    else await this.store.addTask(v);
  }
  split() {
    if (this.task) {
      this.ref.close();
      this.store.split(this.task, this.f.reason.trim());
    }
  }
  skip() {
    if (this.task) {
      this.ref.close();
      this.store.skip(this.task, this.f.reason.trim());
    }
  }
  cancel() {
    this.ref.close();
  }
}
