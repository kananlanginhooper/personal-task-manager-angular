# personal-task-manager-angular

A personal planning dashboard that celebrates small wins: a daily plan, a drag-and-drop week, habits with streaks, goals broken into small steps, a shopping list, a trophy shelf, a Sunday recap, and notes you leave for an assistant to read and answer later.

**[Try the demo](https://kananlanginhooper.github.io/personal-task-manager-angular/)**: generic sample data that lives only in your browser. Check things off, drag tasks between days, change an estimate, earn a trophy.

The API is [personal-task-manager-fastapi](https://github.com/kananlanginhooper/personal-task-manager-fastapi).

## What it does

- **Now.** The top card shows the task on now (or next) and the next daily win, each one tap to check off.
- **Today and this week.** Drag a task by its ⋮⋮ grip to another time or day; the start time fits around its neighbors. Fixed events stay put.
- **Your own estimates.** Click a task to change its time or estimate and say why. The original estimate is kept beside yours, and every change goes into a log.
- **Missed days get rebuilt, not dropped.** Anything that slipped moves to the lightest open evening; big tasks are split first and both halves are placed. Fixed events and repeats that passed just lapse, since the next one is already planned.
- **Celebrations.** Confetti on every check-off; fireworks and a full-screen card for the hard ones, streak milestones, perfect days and every fifth win in a row. Sound can be turned off.
- **Trophies and a Sunday recap.** Trophy rules are data (habit streaks, steps done, totals), so they can be about anything.
- **Notes for the assistant.** Leave feedback from anywhere; it shows as "Waiting" until it's read and answered.

## Design rules

- **Code only.** Areas, habits, tasks, trophies, meal times and every bit of wording come from the API's database. The demo uses made-up sample data.
- Works at phone width; light and dark themes follow the system.

## Develop

Needs Node 20.19+.

```bash
npm install
npm run start:demo                      # sample data, no server needed
cp proxy.conf.example.json proxy.conf.json
npm run start:api                       # talks to the API through /api
npm run api:types                       # regenerate src/app/core/api/schema.d.ts from the running API's OpenAPI
npm test && npm run lint                # unit tests (Karma), angular-eslint
```

Angular 20 with Angular Material and the CDK (drag and drop), standalone OnPush components and signals, zoneless:

```
src/app/
  core/        the page state (plan-store), data sources (API and demo), runtime config, celebrations, models
  shared/      small reusable pieces: card, progress ring, trophy cup, format helpers
  features/    one folder per area: today, week, habits, evening, shopping, goals, notes, trophies,
               activity, header, banners, editor and recap dialogs, celebration layer
src/styles/    theme.scss (shared by every home dashboard, copied unchanged) + game-plan.scss (this app's layer)
```

Each feature has a panel component that reads the store and small presentational rows that only take inputs and emit outputs. Data types come from the API's OpenAPI; the demo swaps in a browser-only data source behind the same interface.

## Build and deploy

```bash
npm run build                           # dist/personal-task-manager/browser
npm run build:demo                      # docs/, the GitHub Pages demo
```

In production the API serves this app: clone both repos side by side and run `docker compose up -d --build` in [personal-task-manager-fastapi](https://github.com/kananlanginhooper/personal-task-manager-fastapi). Its image builds this UI and serves it with the API on one address.

Nothing about hosts, ports or paths is compiled in. Before starting, the app loads `api/config` relative to its `<base href>` and calls the API at the `apiBase` it gets back. The back end sets `<base href>` from `UI_BASE_PATH`, so one build works at `http://<host>:<port>/`, under a path prefix, or at `https://<app>.<domain>`. The demo build skips this and needs no server.

Older options still work: `deploy/serve.py` serves the built app and passes `/api/*` through to an API, and `<meta name="api-base" content="...">` in `index.html` overrides the API base.

## Privacy check before every push

`tools/privacy_scan.py` searches every tracked file for terms in a private denylist (`~/.config/personal-task-manager/denylist.txt` or `$PRIVACY_DENYLIST`) and blocks the push on any match. Turn it on once per clone:

```bash
git config core.hooksPath .githooks
```

## License

GPL-3.0
