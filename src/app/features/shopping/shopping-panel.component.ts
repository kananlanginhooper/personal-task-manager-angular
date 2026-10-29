import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { PlanStore } from '../../core/plan-store';
import { CardComponent } from '../../shared/card/card.component';
import { pointOf } from '../../shared/point';

/** What to buy; checking an item off moves it to the "add again" chips. Stocked staples show as chips too. */
@Component({
  selector: 'app-shopping-panel',
  imports: [
    FormsModule,
    MatButton,
    MatCheckbox,
    MatChipSet,
    MatChip,
    MatFormField,
    MatInput,
    CardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shopping-panel.component.html',
  styleUrl: './shopping-panel.component.scss',
})
export class ShoppingPanelComponent {
  readonly store = inject(PlanStore);
  readonly pointOf = pointOf;
  readonly newItem = signal('');

  readonly need = computed(() => this.store.shopping().filter((i) => !i.stocked && i.need));
  readonly got = computed(() => this.store.shopping().filter((i) => !i.stocked && !i.need));
  readonly stocked = computed(() => this.store.shopping().filter((i) => i.stocked));

  addItem(e: Event) {
    e.preventDefault();
    const v = this.newItem().trim();
    if (v) {
      this.store.addShopping(v);
      this.newItem.set('');
    }
  }
}
