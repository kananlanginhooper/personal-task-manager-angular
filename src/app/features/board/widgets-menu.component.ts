import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/divider';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { BoardLayout, TILE_LABELS, TILE_ORDER } from '../../core/layout/board-layout';

/** The widgets button in the header: switch cards on and off, or put this screen size back to the default. */
@Component({
  selector: 'app-widgets-menu',
  imports: [MatIconButton, MatIcon, MatDivider, MatMenu, MatMenuItem, MatMenuTrigger, MatTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      matIconButton
      type="button"
      class="trigger"
      aria-label="Widgets"
      matTooltip="Widgets: show, hide and reset cards"
      [matMenuTriggerFor]="menu"
    >
      <mat-icon>widgets</mat-icon>
    </button>
    <mat-menu #menu="matMenu" xPosition="before">
      @for (k of keys; track k) {
        <button
          mat-menu-item
          type="button"
          role="menuitemcheckbox"
          [attr.aria-checked]="!layout.isHidden(k)"
          (click)="$event.stopPropagation(); layout.toggleHidden(k)"
        >
          <mat-icon>{{ layout.isHidden(k) ? 'check_box_outline_blank' : 'check_box' }}</mat-icon>
          {{ labels[k] }}
        </button>
      }
      @if (layout.band() !== 'stack') {
        <mat-divider />
        <button
          mat-menu-item
          type="button"
          [disabled]="!layout.isCustom()"
          (click)="layout.resetBand()"
        >
          <mat-icon>restart_alt</mat-icon>
          Reset this screen size's layout
        </button>
      }
    </mat-menu>
  `,
  styles: `
    :host {
      display: block;
      align-self: center;
    }
    .trigger {
      background: var(--surface);
      box-shadow: var(--shadow);
      color: var(--muted);
    }
  `,
})
export class WidgetsMenuComponent {
  readonly layout = inject(BoardLayout);
  readonly keys = TILE_ORDER;
  readonly labels = TILE_LABELS;
}
