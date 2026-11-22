import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Theme } from '../../core/theme';

/** The header's light/dark button. It shows the mode a click switches to. */
@Component({
  selector: 'app-theme-toggle',
  imports: [MatIconButton, MatIcon, MatTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      matIconButton
      type="button"
      class="trigger"
      [attr.aria-label]="label()"
      [matTooltip]="label()"
      (click)="theme.toggle()"
    >
      <mat-icon>{{ theme.mode() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `,
  styles: `
    :host {
      display: block;
    }
    .trigger {
      background: var(--surface);
      box-shadow: var(--shadow);
      color: var(--muted);
    }
  `,
})
export class ThemeToggleComponent {
  readonly theme = inject(Theme);
  readonly label = computed(() =>
    this.theme.mode() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
  );
}
