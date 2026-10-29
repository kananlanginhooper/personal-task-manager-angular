import type { ElementRef } from '@angular/core';

export interface Point {
  x: number;
  y: number;
}

/** Screen position of whatever an event came from, for aiming confetti: a DOM event or a Material change event. */
export function pointOf(e: Event | { source: { _elementRef: ElementRef<HTMLElement> } }): Point {
  const el = 'source' in e ? e.source._elementRef.nativeElement : (e.target as HTMLElement | null);
  if (!el?.getBoundingClientRect) return { x: innerWidth / 2, y: innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
