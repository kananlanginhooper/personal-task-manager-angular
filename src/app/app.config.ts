import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { CDK_DRAG_CONFIG } from '@angular/cdk/drag-drop';
import { DataSource } from './data/data-source';
import { ApiDataSource } from './data/api-data-source';
import { DemoDataSource } from './data/demo-data-source';
import { DATA_MODE } from './data/mode';
import { embedded } from './module-context';
import { loadRuntimeConfig } from './runtime-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // runtime config from the back end before anything starts (not in the Pages demo or when a host page mounts it)
    provideAppInitializer(() => (DATA_MODE === 'api' && !embedded() ? loadRuntimeConfig() : undefined)),
    // drag previews stay inside the shadow root, where the styles are
    { provide: CDK_DRAG_CONFIG, useValue: { previewContainer: 'parent' } },
    { provide: DataSource, useClass: DATA_MODE === 'demo' ? DemoDataSource : ApiDataSource },
  ],
};
