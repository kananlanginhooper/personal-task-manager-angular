import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { DataSource } from './data/data-source';
import { ApiDataSource } from './data/api-data-source';
import { DemoDataSource } from './data/demo-data-source';
import { DATA_MODE } from './data/mode';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: DataSource, useClass: DATA_MODE === 'demo' ? DemoDataSource : ApiDataSource },
  ],
};
