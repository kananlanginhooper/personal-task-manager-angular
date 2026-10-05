export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function parseD(s: string): Date { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(s: string, n: number): string { const d = parseD(s); d.setDate(d.getDate() + n); return iso(d); }
export const todayIso = () => iso(new Date());
export const isWeekend = (s: string) => [0, 6].includes(parseD(s).getDay());
export function mondayOf(s: string): string { const d = parseD(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); }
export function isoWeek(s: string): number {
  const d = parseD(s); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - w1.getTime()) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}
export function toMin(t?: string | null): number | null { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; }
export const fromMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export function fmt12(t?: string | null): string {
  if (!t) return 'any time';
  let [h, m] = t.split(':').map(Number); const am = h < 12; h = h % 12 || 12;
  return `${h}:${pad(m)}${am ? 'a' : ''}`;
}
export const fmtDur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' m' : ''}` : `${m} m`);
export function shortDate(s: string): string { const d = parseD(s); return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`; }
export function clock(isoStr: string): string {
  const d = new Date(isoStr);
  return `${MON[d.getMonth()]} ${d.getDate()} ${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`;
}
