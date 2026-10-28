/**
 * What a host page passes to mount() when Game Plan runs as a module inside another app (for example a dashboard
 * wrapper with a top nav). Standalone, nothing calls setContext and the defaults apply.
 */
export interface ModuleContext { id: string; apiBase: string; }
let ctx: ModuleContext | null = null;

export function setContext(c: ModuleContext) { ctx = c; }

/** true when mounted inside a host page rather than running as its own page */
export const embedded = () => ctx !== null;

/** API base inside a host page (e.g. `/m/<id>/api`), or null standalone */
export const contextApiBase = () => (ctx ? ctx.apiBase.replace(/\/$/, '') : null);
