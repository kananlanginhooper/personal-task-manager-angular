import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideRouteReporter } from './route-reporter';

// Karma runs the specs in an iframe, so this page is framed by the Karma runner's own origin.
describe('route reporter (one-page router)', () => {
  async function setup(parents: string[]) {
    const post = spyOn(window.parent, 'postMessage');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: '', children: [] },
          { path: '**', redirectTo: '' },
        ]),
        provideRouteReporter(() => parents),
      ],
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/some/shared/link');
    return { post, router };
  }

  it('lands any path on the page and reports it to a listed parent', async () => {
    const { post, router } = await setup([location.origin]);
    expect(router.url).toBe('/');
    expect(post.calls.mostRecent().args as unknown[]).toEqual([
      { type: 'route', path: '/' },
      location.origin,
    ]);
  });

  it('stays quiet for a parent not in frameParents', async () => {
    const { post } = await setup(['http://not-the-wrapper.test']);
    expect(post).not.toHaveBeenCalled();
  });
});
