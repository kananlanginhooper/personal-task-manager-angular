import { Bootstrap, Task } from '../models';
import { addDays, mondayOf, todayIso } from '../util/dates';

/** Generic sample data for the public demo. Dates are relative to the current week so it always looks alive. */
export function demoSeed(): Bootstrap {
  const today = todayIso();
  const m = mondayOf(today);
  const d = (n: number) => addDays(m, n);
  let n = 0;
  const t = (p: Partial<Task> & { title: string; date: string; est: number }): Task =>
    ({ id: `demo-${++n}`, start: null, done: false, origEst: p.est, area: 'home', ...p }) as Task;

  const tasks: Task[] = [
    t({ title: 'Sort the junk drawer', date: addDays(today, -1), start: '19:00', est: 20 }),
    t({ title: 'Pay the electric bill', date: d(0), start: '18:00', est: 10, big: true, cheer: 'Bill paid. One less thing on your mind.' }),
    t({ title: 'Practice guitar', date: d(0), start: '19:00', est: 20, area: 'hobby' }),
    t({ title: 'Plan meals for the week', date: d(1), start: '18:00', est: 15, area: 'health' }),
    t({ title: 'Book club', date: d(1), start: '19:00', est: 120, locked: true, recurring: true, cost: 15, note: 'leave 6:40 · starts 7:00' }),
    t({ title: 'Repot the plants', date: d(2), start: '18:00', est: 30 }),
    t({ title: 'Online course: lesson 3', date: d(2), start: '19:00', est: 40, area: 'learning' }),
    t({ title: 'Call the dentist', date: d(3), start: '12:30', est: 10, kind: 'call', remind: true }),
    t({ title: 'Fold the towels', date: d(3), start: '18:30', est: 15, dread: true, hype: 'TOWELS: FOLDED.', note: 'the one nobody likes, so it gets the biggest party' }),
    t({ title: 'Movie night with friends', date: d(4), start: '19:30', est: 150, locked: true, cost: 20 }),
    t({ title: 'Farmers market', date: d(5), start: '09:30', est: 60, cost: 25, area: 'health' }),
    t({ title: 'Hardware store run', date: d(5), start: '11:00', est: 30, travel: 40, closeBy: '17:00', big: true,
        steps: [{ t: 'Drove there', done: false }, { t: 'Got the parts', done: false }, { t: 'Drove home', done: false }] }),
    t({ title: 'Scrub the shower', date: d(6), start: '15:00', est: 20, recurring: true }),
    t({ title: 'Weekly planning', date: d(6), start: '19:00', est: 15, recurring: true }),
    t({ title: 'Birthday card for a friend', date: d(9), start: null, est: 15, remind: true, area: 'hobby' }),
  ];

  const habitDays: Record<string, Record<string, boolean>> = {};
  const pattern = ['water', 'walk', 'read', 'stretch', 'dishes'];
  for (let i = 1; i <= 10; i++) {
    const day = addDays(today, -i);
    habitDays[day] = Object.fromEntries(pattern.map((h, k) => [h, (i + k) % 3 !== 0 || h === 'walk']));
  }

  return {
    settings: {
      appTitle: 'Game Plan (demo)',
      headline: ['Small wins,', 'stacked daily.'],
      capacity: { weekdayMinutes: 240, weekendMinutes: 600, weekdayStart: '17:30', weekendStart: '09:00' },
      boundary: { time: '21:30', label: 'Screens off', sub: 'book, tea, early night' },
      workday: { label: 'Workday', start: '09:00', hours: 8, sub: 'day job' },
      meals: [
        { time: '7:30', text: 'Oatmeal + fruit' }, { time: '12:00', text: 'Soup + sandwich' },
        { time: '6:00', text: 'Stir-fry' }, { time: '9:30', text: 'Screens off', highlight: true },
      ],
      evening: {
        eyebrow: 'Tonight', title: 'When the evening drags', text: 'Pick one of these instead of scrolling. Each one counts as a win.',
        options: [
          { label: 'Stretch 5 min', msg: 'Stretched. Your back says thanks.' },
          { label: 'Call someone', msg: 'You reached out. That matters.' },
          { label: 'Journal one page', msg: 'Thoughts out of your head and onto paper.' },
          { label: 'Tidy one shelf', msg: 'One shelf, done. Small and real.' },
        ],
        suffix: 'instead of scrolling',
      },
    },
    areas: [
      { id: 'home', name: 'Home', color: '#1E6A50', sort: 1, note: 'Chores, bills and the place you live.' },
      { id: 'health', name: 'Health', color: '#2C5BA6', sort: 2, note: 'Food, movement, sleep.' },
      { id: 'learning', name: 'Learning', color: '#7B4AB0', sort: 3, note: 'Courses and skills.' },
      { id: 'hobby', name: 'Hobbies', color: '#D25F25', sort: 4, note: 'Things you do for fun.' },
    ],
    habits: [
      { id: 'water', groupName: 'Morning', name: 'Glass of water', sub: 'before coffee', cheer: 'Hydrated. Good start.', sort: 1, active: true },
      { id: 'stretch', groupName: 'Morning', name: 'Stretch 5 min', sub: 'neck, back, legs', cheer: 'Stretched and ready.', sort: 2, active: true },
      { id: 'walk', groupName: 'Body', name: 'Walk outside', sub: 'any length', cheer: 'Fresh air counts double.', sort: 3, active: true },
      { id: 'read', groupName: 'Mind', name: 'Read 10 pages', sub: 'paper beats screens', cheer: 'Ten pages closer to the end.', sort: 4, active: true },
      { id: 'screens', groupName: 'Mind', name: 'Screens off by 9:30', sub: 'the hard one', cheer: 'Screens off. Sleep will thank you.', big: true, hype: 'SCREENS OFF.', sort: 5, active: true },
      { id: 'dishes', groupName: 'Home', name: 'Dishes done', sub: 'sink empty before bed', cheer: 'Empty sink. Future you is grateful.', sort: 6, active: true },
    ],
    habitDays,
    tasks,
    projects: [
      { id: 'garage', area: 'home', title: 'Garage clean-out', prio: 'high', est: '4 Saturdays', sort: 1,
        steps: [{ t: 'Empty one shelf', done: true }, { t: 'Donate pile to the thrift store', done: false }, { t: 'Hang the bikes', done: false }, { t: 'Sweep the floor', done: false }] },
      { id: 'c25k', area: 'health', title: 'Couch to 5K', prio: 'steady', est: '9 weeks', sort: 2,
        steps: [{ t: 'Week 1', done: true }, { t: 'Week 2', done: false }, { t: 'Week 3', done: false }, { t: 'Race day', done: false }] },
      { id: 'ts', area: 'learning', title: 'Learn TypeScript', prio: 'steady', est: '20 min sessions', sort: 3,
        steps: [{ t: 'Types and interfaces', done: false }, { t: 'Generics', done: false }, { t: 'Build a small app', done: false }] },
      { id: 'birdhouse', area: 'hobby', title: 'Build a birdhouse', prio: 'later', est: '2 afternoons', sort: 4,
        steps: [{ t: 'Pick a plan', done: false }, { t: 'Buy the wood', done: false }, { t: 'Build and paint', done: false }] },
    ],
    shopping: [
      { id: 'oats', item: 'Oats', need: true, stocked: false },
      { id: 'bananas', item: 'Bananas', need: true, stocked: false },
      { id: 'soap', item: 'Dish soap', need: true, stocked: false, note: 'the big bottle' },
      { id: 'pasta', item: 'Pasta', need: false, stocked: true },
    ],
    recurring: [
      { id: 'r1', short: 'TUE', title: 'Book club', rule: '7:00 PM', freq: 'weekly', sort: 1 },
      { id: 'r2', short: 'FRI', title: 'Movie night', rule: 'with friends', freq: 'weekly', sort: 2 },
      { id: 'r3', short: 'SUN', title: 'Weekly planning', rule: '15 min', freq: 'weekly', sort: 3 },
    ],
    trophies: [
      { id: 'first', name: 'First Step', desc: 'Your very first check mark', goal: 1, rule: { type: 'total_wins' }, sort: 1 },
      { id: 'walk7', name: 'Trailblazer', desc: 'Seven walks in a row', goal: 7, rule: { type: 'habit_streak', habit: 'walk' }, sort: 2 },
      { id: 'read10', name: 'Bookworm', desc: 'Read on 10 days', goal: 10, rule: { type: 'habit_days', habit: 'read' }, sort: 3 },
      { id: 'perfect', name: 'Perfect Day', desc: 'All daily habits on one day', goal: 1, rule: { type: 'perfect_days' }, sort: 4 },
      { id: 'towels', name: 'Towel Tamer', desc: 'Fold the towels', goal: 1, rule: { type: 'tasks_done', titleMatch: 'fold' }, sort: 5 },
      { id: 'garage', name: 'Garage Hero', desc: 'Finish the garage', goal: 4, rule: { type: 'project_steps', project: 'garage' }, sort: 6 },
      { id: 'road', name: 'Road Trip', desc: 'Make the hardware store run', goal: 1, rule: { type: 'task_step', withField: 'closeBy', step: 0 }, sort: 7 },
      { id: 'comeback', name: 'Comeback', desc: 'Use Rebuild after a missed day', goal: 1, rule: { type: 'moves', moveType: 'replan' }, sort: 8 },
      { id: 'honest', name: 'Honest Clock', desc: 'Correct three estimates', goal: 3, rule: { type: 'estimate_changes' }, sort: 9 },
      { id: 'wins50', name: 'Fifty Up', desc: 'Reach fifty checks', goal: 50, rule: { type: 'total_wins' }, sort: 10 },
    ],
    awards: {},
    changes: [],
    notes: [
      { id: 'n1', at: new Date(Date.now() - 864e5).toISOString(), text: 'Weeknights are too full. Can chores move to Saturday morning?', status: 'read',
        reply: 'Moved two chores to Saturday 9:30 and kept weeknights to one task each.' },
    ],
  };
}
