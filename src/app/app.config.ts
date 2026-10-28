import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { CDK_DRAG_CONFIG } from '@angular/cdk/drag-drop';
import { DataSource } from './data/data-source';
import { ApiDataSource } from './data/api-data-source';
import { DemoDataSource } from './data/demo-data-source';
import { DATA_MODE } from './data/mode';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // drag previews stay inside the shadow root, where the styles are
    { provide: CDK_DRAG_CONFIG, useValue: { previewContainer: 'parent' } },
    { provide: DataSource, useClass: DATA_MODE === 'demo' ? DemoDataSource : ApiDataSource },
  ],
};
