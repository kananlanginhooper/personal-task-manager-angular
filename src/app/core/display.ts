/**
 * Display view: `?display` in the URL turns the page into a read-only wall screen. No edit controls, no dragging,
 * no dialogs or celebrations, and the API client sends nothing but GETs.
 */
export const DISPLAY = new URLSearchParams(location.search).has('display');

/**
 * A device token can ride in the URL fragment, `#token=...` (a kiosk with no sign-in). The fragment never reaches
 * the server or its logs; the API client sends it as `Authorization: Bearer ...` on every call.
 */
export const URL_TOKEN = new URLSearchParams(location.hash.replace(/^#/, '')).get('token');

/** How often an open page re-reads the plan (app.ts), so a screen left on stays current. */
export const REFRESH_MS = 5 * 60_000;
