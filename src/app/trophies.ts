import { HabitDef, Project, Task, TrophyRule } from './models';
import { addDays, mondayOf } from './util/dates';

export interface TrophyFacts {
  habits: HabitDef[];
  habitDays: Record<string, Record<string, boolean>>;
  tasks: Task[];
  projects: Project[];
}

const daysWith = (f: TrophyFacts, habit: string) => Object.keys(f.habitDays).filter(d => f.habitDays[d]?.[habit]).sort();

function maxStreak(f: TrophyFacts, habit: string): number {
  let best = 0, cur = 0, prev: string | null = null;
  for (const d of daysWith(f, habit)) { cur = prev && addDays(prev, 1) === d ? cur + 1 : 1; best = Math.max(best, cur); prev = d; }
  return best;
}

function bestWeek(f: TrophyFacts, habit: string): number {
  const c: Record<string, number> = {};
  for (const d of daysWith(f, habit)) c[mondayOf(d)] = (c[mondayOf(d)] ?? 0) + 1;
  return Math.max(0, ...Object.values(c));
}

export function totalWins(f: TrophyFacts): number {
  const ids = f.habits.map(h => h.id);
  let n = 0;
  for (const d in f.habitDays) n += ids.filter(k => f.habitDays[d][k]).length;
  n += f.tasks.filter(t => t.done).length;
  for (const p of f.projects) n += p.steps.filter(s => s.done).length;
  return n;
}

export function perfectDays(f: TrophyFacts): number {
  const ids = f.habits.map(h => h.id);
  return ids.length ? Object.keys(f.habitDays).filter(d => ids.every(k => f.habitDays[d][k])).length : 0;
}

/** How far along a rule is (compare with the trophy's goal). */
export function progress(rule: TrophyRule, f: TrophyFacts): number {
  switch (rule.type) {
    case 'total_wins': return totalWins(f);
    case 'habit_streak': return maxStreak(f, rule.habit!);
    case 'habit_days': return daysWith(f, rule.habit!).length;
    case 'habit_week': return bestWeek(f, rule.habit!);
    case 'perfect_days': return perfectDays(f);
    case 'tasks_done': {
      const re = rule.titleMatch ? new RegExp(rule.titleMatch, 'i') : null;
      return f.tasks.filter(t => t.done && (!re || re.test(t.title)) && (!rule.area || t.area === rule.area)).length;
    }
    case 'project_steps': {
      const steps = f.projects.find(p => p.id === rule.project)?.steps ?? [];
      return rule.step !== undefined ? (steps[rule.step]?.done ? 1 : 0) : steps.filter(s => s.done).length;
    }
    case 'task_step':
      return f.tasks.filter(t => (!rule.withField || (t as any)[rule.withField]) && t.steps?.[rule.step ?? 0]?.done).length;
    case 'moves': return f.tasks.some(t => (t.moves ?? []).some(m => m.type === rule.moveType)) ? 1 : 0;
    case 'estimate_changes': return f.tasks.reduce((a, t) => a + (t.estHistory?.length ?? 0), 0);
    case 'sum': return (rule.of ?? []).reduce((a, r) => a + progress(r, f), 0);
    default: return 0;
  }
}
