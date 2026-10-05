export interface Step { t: string; done: boolean; }

export interface EstimateChange { at: string; from: number; to: number; reason?: string | null; }
export interface Move { at: string; from: { date: string; start: string | null }; to: { date: string; start: string | null }; type: string; }

export interface Task {
  id: string;
  title: string;
  date: string;
  start: string | null;
  est: number;
  origEst?: number | null;
  travel?: number | null;
  closeBy?: string | null;
  leave?: string | null;
  area?: string | null;
  kind?: string | null;
  note?: string | null;
  cheer?: string | null;
  hype?: string | null;
  cost?: number | null;
  locked?: boolean;
  recurring?: boolean;
  remind?: boolean;
  work?: boolean;
  big?: boolean;
  dread?: boolean;
  done: boolean;
  doneAt?: string | null;
  status?: string | null;
  steps?: Step[] | null;
  estHistory?: EstimateChange[] | null;
  moves?: Move[] | null;
  splitFrom?: string | null;
}

export interface Area { id: string; name: string; color: string; note?: string | null; sort: number; }

export interface HabitDef {
  id: string; groupName: string; name: string; sub?: string | null; cheer?: string | null;
  big?: boolean; hype?: string | null; sort: number; active: boolean;
}

export interface Project {
  id: string; area?: string | null; title: string; prio: 'urgent' | 'high' | 'steady' | 'later' | string;
  est?: string | null; due?: string | null; next?: string | null; source?: string | null; sort: number; steps: Step[];
}

export interface ShoppingItem { id: string; item: string; need: boolean; stocked: boolean; note?: string | null; }
export interface RecurringRule { id: string; title: string; rule?: string | null; freq?: string | null; short?: string | null; sort: number; }

export interface Change {
  id?: number | string; at: string; type: string; title?: string | null; taskId?: string | null; projectId?: string | null;
  from?: any; to?: any; reason?: string | null; extra?: any;
}

export interface Note {
  id: string; at: string; text: string; taskId?: string | null; taskTitle?: string | null;
  status: 'new' | 'read' | string; reply?: string | null; repliedAt?: string | null;
}

/** A trophy and the rule that earns it. Rules are data, so trophies can name anything without code changes. */
export interface TrophyRule {
  type: 'total_wins' | 'habit_streak' | 'habit_days' | 'habit_week' | 'perfect_days' | 'tasks_done' | 'project_steps'
    | 'task_step' | 'moves' | 'estimate_changes' | 'sum';
  habit?: string; titleMatch?: string; area?: string; project?: string; step?: number; withField?: string;
  moveType?: string; of?: TrophyRule[];
}
export interface TrophyDef { id: string; name: string; desc: string; goal: number; rule: TrophyRule; sort: number; }
export interface Award { id: string; name?: string | null; earnedAt: string; }

export interface Settings {
  appTitle?: string;
  headline?: [string, string];
  capacity?: { weekdayMinutes: number; weekendMinutes: number; weekdayStart: string; weekendStart: string };
  boundary?: { time: string; label: string; sub?: string };
  workday?: { label: string; start: string; hours: number; area?: string; sub?: string };
  meals?: { time: string; text: string; highlight?: boolean }[];
  evening?: { eyebrow: string; title: string; text: string; options: { label: string; msg: string }[]; suffix?: string };
  taxCheer?: { match: string; msg: string };
  [key: string]: unknown;
}

export interface Bootstrap {
  settings: Settings;
  areas: Area[];
  habits: HabitDef[];
  habitDays: Record<string, Record<string, boolean>>;
  tasks: Task[];
  projects: Project[];
  shopping: ShoppingItem[];
  recurring: RecurringRule[];
  trophies: TrophyDef[];
  awards: Record<string, Award>;
  changes: Change[];
  notes: Note[];
}
