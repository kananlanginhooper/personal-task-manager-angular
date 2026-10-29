import { Task } from '../../core/models';
import { nowAndNext } from './now-pick';

const task = (id: string, start: string | null, over: Partial<Task> = {}): Task => ({
  id,
  title: id,
  date: '2030-01-07',
  start,
  est: 30,
  done: false,
  ...over,
});
const at = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

describe('nowAndNext', () => {
  const day = [
    task('work', '09:00', { est: 480, work: true }),
    task('dinner', '18:00'),
    task('dishes', '18:30', { done: true }),
    task('walk', '19:00'),
    task('read', null),
  ];

  it('picks the task whose time covers this minute, then the next one', () => {
    expect(nowAndNext(day, at('18:10'))).toEqual(
      jasmine.objectContaining({ live: true, now: day[1], next: day[3] }),
    );
  });

  it('skips work blocks and done tasks and looks ahead between tasks', () => {
    const p = nowAndNext(day, at('12:00'));
    expect([p.live, p.now?.id, p.next?.id]).toEqual([false, 'dinner', 'walk']);
    expect(nowAndNext(day, at('18:40')).now?.id).toBe('walk');
  });

  it('falls back to untimed tasks, then ones missed earlier today', () => {
    const p = nowAndNext(day, at('21:00'));
    expect([p.live, p.now?.id, p.next?.id]).toEqual([false, 'read', 'dinner']);
    expect(nowAndNext([], at('21:00')).now).toBeUndefined();
  });
});
