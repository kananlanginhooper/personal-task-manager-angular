import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DataSource } from './data/data-source';
import { DemoDataSource } from './data/demo-data-source';
import { Task } from './models';
import { PlanStore } from './plan-store';

const task = (over: Partial<Task>): Task => ({
  id: 't',
  title: 'T',
  date: '2030-01-07',
  start: null,
  est: 30,
  done: false,
  ...over,
});

describe('PlanStore.dropStart', () => {
  let store: PlanStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: DataSource, useClass: DemoDataSource },
      ],
    });
    store = TestBed.inject(PlanStore);
  });

  it('starts a dropped task right after the one above it, on a 5-minute mark', () => {
    const prev = task({ id: 'p', start: '18:00', est: 40 });
    expect(store.dropStart(task({ id: 'x' }), '2030-01-07', prev)).toBe('18:40');
  });

  it('ends a dropped task just before the one below it, but not before the day starts', () => {
    const next = task({ id: 'n', start: '19:00' });
    expect(store.dropStart(task({ id: 'x', est: 30 }), '2030-01-07', undefined, next)).toBe(
      '18:30',
    );
    const early = task({ id: 'n', start: '17:20' });
    expect(store.dropStart(task({ id: 'x', est: 30 }), '2030-01-07', undefined, early)).toBe(
      '17:15',
    ); // weekday start 17:15
  });
});
