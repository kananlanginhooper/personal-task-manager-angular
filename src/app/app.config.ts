import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { ApiDataSource } from './core/data/api-data-source';
import { DataSource } from './core/data/data-source';
import { DemoDataSource } from './core/data/demo-data-source';
import { DATA_MODE } from './core/data/mode';
import { loadRuntimeConfig } from './core/runtime-config';

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
    // the demo build swaps data/mode.ts, so the same components run on browser-only sample data
    { provide: DataSource, useClass: DATA_MODE === 'demo' ? DemoDataSource : ApiDataSource },
  ],
};
