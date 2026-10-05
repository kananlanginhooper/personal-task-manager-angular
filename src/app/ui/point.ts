/** Screen position of the element an event came from, for aiming confetti. */
export function pointOf(e: Event): { x: number; y: number } {
  const el = e.target as HTMLElement | null;
  if (!el?.getBoundingClientRect) return { x: innerWidth / 2, y: innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
