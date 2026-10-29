import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A titled panel. Put header buttons in a child with the `card-action` attribute; everything else is the body. */
@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel" [attr.aria-labelledby]="id()">
      <div class="panel-head">
        <h2 [id]="id()">{{ heading() }}</h2>
        @if (eyebrow()) {
          <span class="eyebrow">{{ eyebrow() }}</span>
        }
        <ng-content select="[card-action]" />
      </div>
      <ng-content />
    </section>
  `,
  host: { style: 'display:block;min-width:0' },
})
export class CardComponent {
  readonly heading = input.required<string>();
  readonly eyebrow = input('');
  /** id for the heading, so the section is labelled by it */
  readonly id = input.required<string>();
}
