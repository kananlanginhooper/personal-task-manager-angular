import { Task } from '../../core/models';
import { taskTotal, toMin } from '../../shared/format';

/**
 * What's on now and what's next, from today's tasks (already sorted by start time). "Now" is the open task whose
 * time covers this minute, else the next timed one, else one with no time, else one whose time passed earlier today.
 * Work blocks are left out.
 */
export function nowAndNext(
  today: Task[],
  nowMin: number,
): { now?: Task; next?: Task; live: boolean } {
  const open = today.filter((t) => !t.done && !t.work && t.status !== 'skipped');
  const ends = (t: Task) => toMin(t.start)! + taskTotal(t);
  const timed = open.filter((t) => t.start && ends(t) > nowMin);
  const untimed = open.filter((t) => !t.start);
  const missed = open.filter((t) => t.start && ends(t) <= nowMin);
  const queue = [...timed, ...untimed, ...missed];
  const live = !!timed[0] && toMin(timed[0].start)! <= nowMin;
  return { now: queue[0], next: queue[1], live };
}
