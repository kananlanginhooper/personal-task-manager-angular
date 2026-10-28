import { bootstrapApplication, createApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { ModuleContext, setContext } from './app/module-context';

const FONTS = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Atkinson+Hyperlegible:wght@400;700&family=IBM+Plex+Mono:wght@400;500&display=swap';

/**
 * Module entry: a host page imports this file and calls mount(); the returned function unmounts.
 * Fonts go in the document head because @font-face doesn't apply from inside a shadow root.
 */
export async function mount(host: HTMLElement, ctx: ModuleContext): Promise<() => void> {
  setContext(ctx);
  if (!document.querySelector(`link[href="${FONTS}"]`)) {
    document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: FONTS }));
  }
  const el = host.appendChild(document.createElement('app-root'));
  const app = await createApplication(appConfig);
  app.bootstrap(App, el);
  return () => { app.destroy(); el.remove(); };
}

// standalone page (ng serve, the API server's page, the GitHub Pages demo): index.html has <app-root> in the body
if (document.querySelector('body > app-root')) bootstrapApplication(App, appConfig).catch(err => console.error(err));
