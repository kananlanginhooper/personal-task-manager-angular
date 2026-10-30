import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter } from '@angular/router';
import { provideRouteReporter } from '../for-apps/route-reporter';
import { ApiDataSource } from './core/data/api-data-source';
import { DataSource } from './core/data/data-source';
import { DemoDataSource } from './core/data/demo-data-source';
import { DATA_MODE } from './core/data/mode';
import { loadRuntimeConfig, runtimeConfig } from './core/runtime-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // runtime config from the back end before anything starts (the Pages demo has no back end)
    provideAppInitializer(() => (DATA_MODE === 'api' ? loadRuntimeConfig() : undefined)),
    // <mat-icon>name</mat-icon> draws from Material Symbols (loaded in index.html)
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
    // one page: every path lands on it, so a link shared from the home-dashboards wrapper always opens
    provideRouter([
      { path: '', children: [] },
      { path: '**', redirectTo: '' },
    ]),
    // tells the wrapper which page is open (copied unchanged from the wrapper repo's ui/src/for-apps)
    provideRouteReporter(() => runtimeConfig().frameParents),
    // the demo build swaps data/mode.ts, so the same components run on browser-only sample data
    { provide: DataSource, useClass: DATA_MODE === 'demo' ? DemoDataSource : ApiDataSource },
  ],
};
