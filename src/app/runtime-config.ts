/**
 * Runtime config from the back end's GET /api/config, loaded (relative to <base href>) before the app starts, so no host,
 * port or path is compiled in. The GitHub Pages demo has no back end and keeps the defaults.
 */
export interface RuntimeConfig {
  apiBase: string;
  basePath: string;
  publicUrl: string;
  frameParents: string[];
  login: { enabled: boolean; issuer: string; clientId: string };
}

let cfg: RuntimeConfig = {
  apiBase: 'api/', basePath: '/', publicUrl: '', frameParents: [],
  login: { enabled: false, issuer: '', clientId: '' },
};

export const runtimeConfig = () => cfg;

export async function loadRuntimeConfig(): Promise<void> {
  try {
    const res = await fetch(new URL('api/config', document.baseURI));
    if (res.ok) cfg = { ...cfg, ...(await res.json()) };
  } catch { /* no back end: keep the defaults */ }
}

/** API base as an absolute path without a trailing slash, e.g. `/api` or `/plan/api` */
export const configApiBase = () => new URL(cfg.apiBase, document.baseURI).pathname.replace(/\/$/, '');
