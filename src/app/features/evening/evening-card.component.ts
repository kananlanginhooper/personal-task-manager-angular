import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { PlanStore } from '../../core/plan-store';
import { pointOf } from '../../shared/point';

/** The evening card from settings: a few alternatives to pick from instead; each one counts as a win. */
@Component({
  selector: 'app-evening-card',
  imports: [MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.settings().evening; as ev) {
      <section class="evening" aria-labelledby="eveH">
        <div class="eyebrow">{{ ev.eyebrow }}</div>
        <h3 id="eveH">{{ ev.title }}</h3>
        <p>{{ ev.text }}</p>
        <div class="swap">
          @for (o of ev.options; track o.label) {
            <button
              matButton="outlined"
              type="button"
              [disabled]="used().has(o.label)"
              (click)="swap(o.label, o.msg, $event)"
            >
              {{ o.label }}
            </button>
          }
        </div>
      </section>
    }
  `,
  styleUrl: './evening-card.component.scss',
})
export class EveningCardComponent {
  readonly store = inject(PlanStore);
  readonly used = signal(new Set<string>());

  swap(label: string, msg: string, e: Event) {
    this.used.update((s) => new Set(s).add(label));
    this.store.eveningSwap(label, msg, pointOf(e));
  }
}
