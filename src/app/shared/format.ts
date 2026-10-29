import type { Task } from '../core/models';

export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MON = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function parseD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(s: string, n: number): string {
  const d = parseD(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
export const todayIso = () => iso(new Date());
export const isWeekend = (s: string) => [0, 6].includes(parseD(s).getDay());
export function mondayOf(s: string): string {
  const d = parseD(s);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return iso(d);
}
export function isoWeek(s: string): number {
  const d = parseD(s);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - w1.getTime()) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}
export function toMin(t?: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
export const fromMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export function fmt12(t?: string | null): string {
  if (!t) return 'any time';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)}${h < 12 ? 'a' : ''}`;
}
export const fmtDur = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' m' : ''}` : `${m} m`;
export function shortDate(s: string): string {
  const d = parseD(s);
  return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`;
}
export function clock(isoStr: string): string {
  const d = new Date(isoStr);
  return `${MON[d.getMonth()]} ${d.getDate()} ${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`;
}

// ---- task display helpers (used by the today and week views)

/** Minutes a task takes, including the drive. */
export const taskTotal = (t: Task) => (t.est || 0) + (t.travel || 0);
/** True when the person changed the original estimate. */
export const estChanged = (t: Task) => !!t.origEst && t.est !== t.origEst;
/** "30 m + 20 m drive · leave 6:15 · ~$20" */
export function taskSub(t: Task): string {
  return [
    t.travel ? `${fmtDur(t.est)} + ${t.travel} m drive` : fmtDur(t.est || 0),
    t.leave ? `leave ${fmt12(t.leave)}` : '',
    t.cost ? `~$${t.cost}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
