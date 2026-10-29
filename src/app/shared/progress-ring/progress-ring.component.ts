import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const CIRCUMFERENCE = 2 * Math.PI * 23;

/** The gold ring around today's score. */
@Component({
  selector: 'app-progress-ring',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 56 56" aria-hidden="true">
      <circle class="track" cx="28" cy="28" r="23" />
      <circle
        class="val"
        cx="28"
        cy="28"
        r="23"
        [attr.stroke-dasharray]="c"
        [attr.stroke-dashoffset]="offset()"
      />
    </svg>
  `,
  styleUrl: './progress-ring.component.scss',
})
export class ProgressRingComponent {
  /** 0 to 1 */
  readonly value = input(0);
  readonly c = CIRCUMFERENCE;
  readonly offset = computed(() => CIRCUMFERENCE * (1 - this.value()));
}
