import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CelebrateService } from './core/celebrate.service';
import { PlanStore } from './core/plan-store';
import { ChangeLogComponent } from './features/activity/change-log.component';
import { ComingUpComponent } from './features/activity/coming-up.component';
import { RecentWinsComponent } from './features/activity/recent-wins.component';
import { RecapBannerComponent } from './features/banners/recap-banner.component';
import { ReplanBannerComponent } from './features/banners/replan-banner.component';
import { CelebrationLayerComponent } from './features/celebrate/celebration-layer.component';
import { EditorData, TaskEditorDialog } from './features/editor/task-editor.dialog';
import { EveningCardComponent } from './features/evening/evening-card.component';
import { GoalsPanelComponent } from './features/goals/goals-panel.component';
import { HabitsPanelComponent } from './features/habits/habits-panel.component';
import { DemoBarComponent } from './features/header/demo-bar.component';
import { PageHeaderComponent } from './features/header/page-header.component';
import { NotesPanelComponent } from './features/notes/notes-panel.component';
import { NowCardComponent } from './features/now/now-card.component';
import { RecapDialog } from './features/recap/recap.dialog';
import { ShoppingPanelComponent } from './features/shopping/shopping-panel.component';
import { TodayPanelComponent } from './features/today/today-panel.component';
import { TrophyShelfComponent } from './features/trophies/trophy-shelf.component';
import { WeekPanelComponent } from './features/week/week-panel.component';

/** The page: lays out every feature and opens the editor and recap dialogs when the store asks for them. */
@Component({
  selector: 'app-root',
  imports: [
    CdkDropListGroup,
    DemoBarComponent,
    PageHeaderComponent,
    NowCardComponent,
    RecapBannerComponent,
    ReplanBannerComponent,
    TodayPanelComponent,
    WeekPanelComponent,
    HabitsPanelComponent,
    EveningCardComponent,
    ShoppingPanelComponent,
    GoalsPanelComponent,
    NotesPanelComponent,
    TrophyShelfComponent,
    ComingUpComponent,
    RecentWinsComponent,
    ChangeLogComponent,
    CelebrationLayerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: { '[class.pulse]': 'fx.pulse()' },
})
// eslint-disable-next-line @angular-eslint/component-class-suffix -- the CLI's default root name since Angular 20
export class App {
  readonly store = inject(PlanStore);
  readonly fx = inject(CelebrateService);
  private readonly dialog = inject(MatDialog);
  private editorRef?: MatDialogRef<TaskEditorDialog>;
  private recapRef?: MatDialogRef<RecapDialog>;

  constructor() {
    this.store.load();
    effect(() => {
      const ed = this.store.editor();
      untracked(() => (ed ? this.openEditor(ed) : this.editorRef?.close()));
    });
    effect(() => {
      const week = this.store.recap();
      untracked(() => (week ? this.openRecap(week) : this.recapRef?.close()));
    });
  }

  private openEditor(data: EditorData) {
    this.editorRef?.close();
    const ref = (this.editorRef = this.dialog.open(TaskEditorDialog, {
      data,
      width: '480px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
    }));
    ref.afterClosed().subscribe(() => {
      if (this.editorRef === ref) {
        this.editorRef = undefined;
        this.store.editor.set(null);
      }
    });
  }

  private openRecap(weekStart: string) {
    if (this.recapRef) return;
    const ref = (this.recapRef = this.dialog.open(RecapDialog, {
      data: weekStart,
      width: '760px',
      maxWidth: '95vw',
      autoFocus: false,
    }));
    ref.afterClosed().subscribe(() => {
      this.recapRef = undefined;
      this.store.recap.set(null);
    });
  }
}
