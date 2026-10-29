import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { DemoDataSource } from '../../core/data/demo-data-source';

/** Shown only in the GitHub Pages demo: explains the sample data and resets it. */
@Component({
  selector: 'app-demo-bar',
  imports: [MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      ><b>Demo.</b> Sample data that lives only in this browser. Check things off, drag tasks, earn
      a trophy.</span
    >
    <button matButton="filled" class="small" type="button" (click)="reset()">Reset demo</button>
  `,
  styleUrl: './demo-bar.component.scss',
})
export class DemoBarComponent {
  reset() {
    DemoDataSource.reset();
    location.reload();
  }
}
