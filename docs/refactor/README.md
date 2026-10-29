# Refactor to the shared template: before and after

Screens of the GitHub Pages demo (sample data only), 1280×900 in dark mode unless noted. `before-*` is `main` at 31dce31; `after-*` is branch `refactor/template`.

| Screen | Before | After |
|---|---|---|
| Top: header, score, slipped tasks, today, daily wins | before-1-top.jpg | after-1-top.jpg |
| Week and right column | before-2-week.jpg | after-2-week.jpg |
| Notes, trophy shelf, bottom row | before-3-notes-trophies.jpg | after-3-notes-trophies.jpg |
| Task editor | before-4-editor.jpg | after-4-editor.jpg |
| Sunday recap | before-5-recap.jpg | after-5-recap.jpg |
| Light mode (new screenshot) | | after-6-light.jpg |
| Phone width, 375 px (new screenshot) | | after-7-mobile.jpg |

## Intentional changes

- **Shared theme.** Surfaces, text and line colors now come from the shared Material 3 theme, so cards and backgrounds match the other dashboards. Game Plan's green is its `--app-accent`. Gold, the trophy shelf and the celebration gradients are unchanged.
- **Fonts.** Body text uses the shared system font (Atkinson Hyperlegible is no longer loaded). Headings, the hero card and the recap keep Bricolage Grotesque.
- **Material controls.** Checkboxes, buttons, form fields and selects, the goal area chips, progress bars and Material Symbols icons replace the hand-made ones. The editor and recap are Material dialogs (Escape and backdrop click close them, and focus stays inside them).
- **Keyboard.** Task titles in the today and week views can be focused and opened with Enter.
- **Embedding.** The root no longer renders in a shadow root, and `mount()` is gone. Home dashboards shows the app in an iframe now.

Everything else (data, wording, drag and drop, rebuild, trophies, celebrations) behaves as before.
