/**
 * Display view: `?display` in the URL turns the page into a read-only wall screen. No edit controls, no dragging,
 * no dialogs or celebrations, and the API client sends nothing but GETs.
 */
export const DISPLAY = new URLSearchParams(location.search).has('display');

/**
 * Low-power celebrations (the Pi 3 at 1080p): fewer confetti particles and bursts, no page shake, no blurred shadows
 * on anything that animates. On by itself when the browser reports 1 GB of memory or less; `?lite` forces it on and
 * `?lite=0` off.
 */
export const LITE = (() => {
  const q = new URLSearchParams(location.search).get('lite');
  if (q !== null) return q !== '0';
  const mem = (navigator as { deviceMemory?: number }).deviceMemory;
  return mem !== undefined && mem <= 1;
})();

/**
 * A device token can ride in the URL fragment, `#token=...` (a kiosk with no sign-in). The fragment never reaches
 * the server or its logs; the API client sends it as `Authorization: Bearer ...` on every call.
 */
export const URL_TOKEN = new URLSearchParams(location.hash.replace(/^#/, '')).get('token');

/** How often an open page re-reads the plan (app.ts), so a screen left on stays current. */
export const REFRESH_MS = 5 * 60_000;
