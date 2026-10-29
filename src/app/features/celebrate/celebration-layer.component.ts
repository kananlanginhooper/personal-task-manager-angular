import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { CelebrateService } from '../../core/celebrate.service';

/** The full-screen hero card, the toast and the sound toggle. Confetti and fireworks draw on their own canvas. */
@Component({
  selector: 'app-celebration-layer',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './celebration-layer.component.html',
  styleUrl: './celebration-layer.component.scss',
  host: { '(document:keydown.escape)': 'fx.dismissHero()' },
})
export class CelebrationLayerComponent {
  readonly fx = inject(CelebrateService);
}
