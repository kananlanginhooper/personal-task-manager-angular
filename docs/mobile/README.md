# Phone check: before and after

Screens of the demo (sample data only) at 390 px wide, dark mode. `before-*` is the GitHub Pages demo before the phone fixes; `after-*` is the fixed build.

| Screen | Before | After |
|---|---|---|
| This week | before-week-390.jpg | after-week-390.jpg |
| Daily small wins | before-habits-390.jpg | after-habits-390.jpg |

Checked at 360, 390 and 414 px, 844×390 landscape and 768 px, on its own and inside a frame:

- No sideways page scroll at any width. The week scrolls inside its own box at tablet width and stacks the days on a phone.
- Every button, checkbox, chip and tappable task is at least 44 px. Drag handles keep their look but take touches from a 44 px square.
- Text fields use 16 px text, so iOS doesn't zoom in when you tap one.
- The habit rows put the 14-day dots under the name, so names no longer wrap a word per line.
- The week's arrows, dates and Add share one row and the dates stay on one line.
- The sound toggle shrinks to a round icon so it covers less of the page.
- The editor and recap dialogs fit the width (95vw), and confetti, toasts and the full-screen trophy card all fit.
- Tooltips only repeat text that's already on screen, so nothing is hover-only.
