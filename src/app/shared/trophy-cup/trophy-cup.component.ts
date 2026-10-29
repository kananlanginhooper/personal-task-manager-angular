import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A trophy cup: gold with a star when earned, grey with a question mark when not. */
@Component({
  selector: 'app-trophy-cup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trophy-cup.component.html',
  host: { style: 'display:contents' },
})
export class TrophyCupComponent {
  readonly earned = input(false);
  /** unique per trophy, so each gradient id is unique on the page */
  readonly id = input.required<string>();
}
