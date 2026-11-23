import type { ElementRef } from '@angular/core';
import { LITE } from '../core/display';

export interface Point {
  x: number;
  y: number;
}

/** Screen position of whatever an event came from, for aiming confetti: a DOM event or a Material change event.
 *  Low-power screens have no confetti to aim, so they skip the measuring: after a click it forces a full layout,
 *  10-15 ms on the Pi. */
export function pointOf(e: Event | { source: { _elementRef: ElementRef<HTMLElement> } }): Point {
  if (LITE) return { x: innerWidth / 2, y: innerHeight / 2 };
  const el = 'source' in e ? e.source._elementRef.nativeElement : (e.target as HTMLElement | null);
  if (!el?.getBoundingClientRect) return { x: innerWidth / 2, y: innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
