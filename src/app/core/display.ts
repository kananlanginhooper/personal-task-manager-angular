/**
 * Display view: `?display` in the URL turns the page into a read-only wall screen (the Pi kiosk). No edit
 * controls, no dragging, no dialogs or celebrations; app.ts refreshes the data every few minutes and reloads the
 * page when the date changes.
 *
 * A device token for it can ride in the URL fragment, `?display#token=...`. The fragment never reaches the server
 * or its logs; the API client sends it as `Authorization: Bearer ...` on every call.
 */
export const DISPLAY = new URLSearchParams(location.search).has('display');

export const DISPLAY_TOKEN = DISPLAY
  ? new URLSearchParams(location.hash.replace(/^#/, '')).get('token')
  : null;

/** How often the display view re-reads the plan. */
export const DISPLAY_REFRESH_MS = 5 * 60_000;
