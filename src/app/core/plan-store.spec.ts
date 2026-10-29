import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DataSource } from './data/data-source';
import { DemoDataSource } from './data/demo-data-source';
import { Task } from './models';
import { PlanStore } from './plan-store';
import { CelebrateService } from './celebrate.service';
import { addDays, todayIso } from '../shared/format';

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

describe('PlanStore missed tasks', () => {
  let store: PlanStore;
  let ds: DataSource;
  const yesterday = addDays(todayIso(), -1);

  beforeEach(async () => {
    DemoDataSource.reset();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: DataSource, useClass: DemoDataSource },
      ],
    });
    store = TestBed.inject(PlanStore);
    ds = TestBed.inject(DataSource);
    spyOn(TestBed.inject(CelebrateService), 'celebrate');
  });
  afterEach(() => DemoDataSource.reset());

  it('lets fixed events and passed repeats lapse instead of counting them as slipped', () => {
    store.tasks.set([
      task({ id: 'once', date: yesterday }),
      task({ id: 'event', date: yesterday, locked: true }),
      task({ id: 'chore', date: yesterday, recurring: true }),
    ]);
    expect(store.overdue().map((t) => t.id)).toEqual(['once']);
  });

  it('places both halves of a split on open days, and never splits a piece again', async () => {
    const big = await ds.addTask({
      title: 'Paint the fence',
      date: yesterday,
      start: null,
      est: 120,
      area: null,
    });
    await ds.addTask({
      title: 'Wash the car (part 3)',
      date: yesterday,
      start: null,
      est: 60,
      area: null,
    });
    await store.load();
    await store.rebuild({ x: 0, y: 0 });

    const fence = store.tasks().filter((t) => t.title.startsWith('Paint the fence'));
    expect(fence.map((t) => t.title).sort()).toEqual([
      'Paint the fence (part 1)',
      'Paint the fence (part 2)',
    ]);
    expect(fence.every((t) => t.date >= store.today)).toBeTrue();
    expect(fence.find((t) => t.id === big.id)?.est).toBe(60);
    const car = store.tasks().filter((t) => t.title.startsWith('Wash the car'));
    expect(car.length).toBe(1);
    expect(car[0].date >= store.today).toBeTrue();
    expect(store.overdue()).toEqual([]);
  });
});
