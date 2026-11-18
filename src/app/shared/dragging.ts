import { Signal, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkDrag } from '@angular/cdk/drag-drop';

/** True while the cdkDrag on this component's host is being dragged, and for a moment after the drop. A tap tooltip
 *  on the drag handle binds its disabled input to it, so lifting the finger after a drag doesn't open "Drag to move".
 *  Call it in a field initializer. */
export function draggingOfHost(): Signal<boolean> {
  const drag = inject(CdkDrag, { optional: true, self: true });
  const dragging = signal(false);
  drag?.started.pipe(takeUntilDestroyed()).subscribe(() => dragging.set(true));
  drag?.ended
    .pipe(takeUntilDestroyed())
    .subscribe(() => setTimeout(() => dragging.set(false), 300));
  return dragging.asReadonly();
}
