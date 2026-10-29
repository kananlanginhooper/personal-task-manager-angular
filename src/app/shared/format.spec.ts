import { Task } from '../core/models';
import { addDays, estChanged, fmt12, fmtDur, mondayOf, taskSub, taskTotal } from './format';

const task = (over: Partial<Task> = {}): Task => ({
  id: 't',
  title: 'T',
  date: '2030-01-07',
  start: null,
  est: 30,
  done: false,
  ...over,
});

describe('format', () => {
  it('writes times the short way', () => {
    expect(fmt12('09:05')).toBe('9:05a');
    expect(fmt12('18:30')).toBe('6:30');
    expect(fmt12('00:15')).toBe('12:15a');
    expect(fmt12(null)).toBe('any time');
  });

  it('writes durations in hours and minutes', () => {
    expect(fmtDur(45)).toBe('45 m');
    expect(fmtDur(60)).toBe('1 h');
    expect(fmtDur(95)).toBe('1 h 35 m');
  });

  it('does date arithmetic on ISO days', () => {
    expect(addDays('2030-01-31', 1)).toBe('2030-02-01');
    expect(mondayOf('2030-01-10')).toBe('2030-01-07');
    expect(mondayOf('2030-01-13')).toBe('2030-01-07');
  });

  it('describes a task with its drive, departure and cost', () => {
    expect(taskTotal(task({ travel: 20 }))).toBe(50);
    expect(taskSub(task({ travel: 20, leave: '18:15', cost: 20 }))).toBe(
      '30 m + 20 m drive · leave 6:15 · ~$20',
    );
    expect(estChanged(task({ origEst: 30, est: 45 }))).toBeTrue();
    expect(estChanged(task({ origEst: 30 }))).toBeFalse();
  });
});
