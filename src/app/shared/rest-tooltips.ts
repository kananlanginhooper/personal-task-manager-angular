/** How long the mouse rests on something before its tooltip is started. */
export const REST_MS = 700;

/**
 * For low-power screens (core/display.ts LITE): a tooltip starts only once the mouse has rested on its trigger, not
 * as the mouse crosses it. Material builds the tooltip's overlay on mouseenter and its show delay only holds back the
 * fade-in, so every card the mouse crossed cost about 90 ms of script on the Pi. This catches mouseenter on a
 * tooltip trigger before Material sees it, and passes it on after REST_MS if the mouse is still there. Taps
 * (for-apps/tap-tooltip.ts, on pointerup) and keyboard focus are not touched. Returns the undo.
 */
export function restTooltips(doc: Document = document): () => void {
  const passing = new WeakSet<Event>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const enter = (e: Event) => {
    const el = e.target as Element;
    if (passing.has(e) || !el.classList?.contains('mat-mdc-tooltip-trigger')) return;
    e.stopImmediatePropagation();
    clearTimeout(timer);
    const { clientX, clientY } = e as MouseEvent;
    timer = setTimeout(() => {
      if (!el.matches(':hover')) return;
      const again = new MouseEvent('mouseenter', { clientX, clientY });
      passing.add(again);
      el.dispatchEvent(again);
    }, REST_MS);
  };
  // mouseenter doesn't bubble, but a capturing listener on the document still sees it before the element does
  doc.addEventListener('mouseenter', enter, true);
  return () => {
    clearTimeout(timer);
    doc.removeEventListener('mouseenter', enter, true);
  };
}
