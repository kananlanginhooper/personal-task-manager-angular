# personal-task-manager-angular

A personal planning dashboard that celebrates small wins: a daily plan, a drag-and-drop week, habits with streaks, goals broken into small steps, a shopping list, a trophy shelf, a Sunday recap, and notes you leave for an assistant to read and answer later.

**[Try the demo](https://kananlanginhooper.github.io/personal-task-manager-angular/)**: generic sample data that lives only in your browser. Check things off, drag tasks between days, change an estimate, earn a trophy.

The API is [personal-task-manager-fastapi](https://github.com/kananlanginhooper/personal-task-manager-fastapi).

## What it does

- **Today and this week.** Drag a task by its ⋮⋮ grip to another time or day; the start time fits around its neighbours. Fixed events stay put.
- **Your own estimates.** Click a task to change its time or estimate and say why. The original estimate is kept beside yours, and every change goes into a log.
- **Missed days get rebuilt, not dropped.** Anything that slipped moves to the lightest open evening; big tasks are split first.
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
```

## Build and deploy

```bash
npm run build                           # dist/personal-task-manager/browser, uses /api on the same address
npm run build:demo                      # docs/, the GitHub Pages demo
```

`deploy/serve.py` serves the built app and passes `/api/*` through to the API, so the page only talks to one address:

```bash
API_URL=http://127.0.0.1:8095 python3 deploy/serve.py --port 8096 --root dist/personal-task-manager/browser
```

To point a build at a different API, add `<meta name="api-base" content="https://example/api">` to `index.html`.

## Privacy check before every push

`tools/privacy_scan.py` searches every tracked file for terms in a private denylist (`~/.config/personal-task-manager/denylist.txt` or `$PRIVACY_DENYLIST`) and blocks the push on any match. Turn it on once per clone:

```bash
git config core.hooksPath .githooks
```

## License

GPL-3.0
