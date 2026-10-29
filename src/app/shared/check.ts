import type { Point } from './point';

/** What a checkbox row emits: the new state and where to aim the confetti. */
export interface Check {
  done: boolean;
  at: Point;
}
/** Same, for one step of a task or goal. */
export interface StepCheck extends Check {
  index: number;
}
