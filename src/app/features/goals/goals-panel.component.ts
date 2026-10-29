import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatChipListbox, MatChipListboxChange, MatChipOption } from '@angular/material/chips';
import { PlanStore } from '../../core/plan-store';
import { CardComponent } from '../../shared/card/card.component';
import { GoalCardComponent } from './goal-card.component';

/** Goals grouped by area: pick an area, see its goals as cards. The chosen area is remembered in this browser. */
@Component({
  selector: 'app-goals-panel',
  imports: [MatChipListbox, MatChipOption, CardComponent, GoalCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card heading="Goals, broken into small steps" id="goalsH">
      <mat-chip-listbox
        class="areas"
        aria-label="Area"
        [hideSingleSelectionIndicator]="true"
        [value]="current()"
        (change)="pick($event)"
      >
        @for (a of store.areas(); track a.id) {
          <mat-chip-option [value]="a.id" [selectable]="a.id !== current()">
            <i class="area-dot round" [style.background]="a.color"></i>{{ a.name }}
            <span class="mono count">{{ count()[a.id] || 0 }}</span>
          </mat-chip-option>
        }
      </mat-chip-listbox>
      @if (area(); as a) {
        <p class="areanote">{{ a.note }}</p>
      }
      <div class="projects">
        @for (p of projects(); track p.id) {
          <app-goal-card
            [project]="p"
            [color]="area()?.color ?? ''"
            (stepToggled)="store.toggleProjectStep(p, $event.index, $event.done, $event.at)"
          />
        } @empty {
          <div class="empty">Nothing here yet.</div>
        }
      </div>
    </app-card>
  `,
  styleUrl: './goals-panel.component.scss',
})
export class GoalsPanelComponent {
  readonly store = inject(PlanStore);
  private readonly chosen = signal<string | null>(this.readArea());

  readonly current = computed(() => {
    const ids = this.store.areas().map((a) => a.id),
      c = this.chosen();
    return c && ids.includes(c) ? c : (ids[0] ?? null);
  });
  readonly area = computed(() => this.store.areas().find((a) => a.id === this.current()));
  readonly projects = computed(() =>
    this.store
      .projects()
      .filter((p) => p.area === this.current())
      .sort((a, b) => (a.sort ?? 99) - (b.sort ?? 99)),
  );
  readonly count = computed(() => {
    const out: Record<string, number> = {};
    for (const p of this.store.projects()) if (p.area) out[p.area] = (out[p.area] ?? 0) + 1;
    return out;
  });

  private readArea() {
    try {
      return localStorage.getItem('ptm-area');
    } catch {
      return null;
    }
  }
  pick(e: MatChipListboxChange) {
    if (!e.value) return;
    this.chosen.set(e.value);
    try {
      localStorage.setItem('ptm-area', e.value);
    } catch {
      /* storage blocked */
    }
  }
}
