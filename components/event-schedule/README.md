# Event Schedule

[![Event Schedule, live on kodza.dev](https://kodza.dev/anim/event-schedule/og.jpg)](https://kodza.dev/components/event-schedule/)

A conference programme from a plain list: day tabs, the venue's clock, the live session marked, a Now marker on the rail, summaries that open and save as .ics.

**[Live demo](https://kodza.dev/components/event-schedule/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-event-schedule.html`](kodza-event-schedule.html) | 8.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-event-schedule.css`](kodza-event-schedule.css) | 36.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-event-schedule.js`](kodza-event-schedule.js) | 33.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-event-schedule.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-event-schedule.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/event-schedule/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Event Schedule to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-event-schedule]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-event-schedule-bg` | `var(--kz-color-paper, #ffffff)` | the day tabs |
| `--kz-event-schedule-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-event-schedule-muted` | `color-mix(in srgb, var(--kz-event-schedule-fg) 62%, transparent)` |  |
| `--kz-event-schedule-border` | `color-mix(in srgb, var(--kz-event-schedule-fg) 12%, transparent)` | the rail |
| `--kz-event-schedule-soft` | `color-mix(in srgb, var(--kz-event-schedule-fg) 7%, transparent)` | the Next badge, the calendar button |
| `--kz-event-schedule-hover` | `color-mix(in srgb, var(--kz-event-schedule-fg) 4%, transparent)` | a row under the pointer, the row on stage |
| `--kz-event-schedule-dot` | `color-mix(in srgb, var(--kz-event-schedule-fg) 28%, transparent)` | a session still to come |
| `--kz-event-schedule-ink` | `var(--kz-color-accent, var(--kz-event-schedule-fg))` | the pill, Live, Now, the time gone |
| `--kz-event-schedule-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-event-schedule-rail` | `52px` | the column of the rail, left of the sessions |
| `--kz-event-schedule-time` | `96px` | the column of the times |
| `--kz-event-schedule-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-event-schedule-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-kodza-event-schedule`, `data-label`, `data-now`, `data-place` (e.g. `Le Havre`), `data-timezone` (e.g. `Europe/Paris`), `data-url`
- Events: `kodza:day`, `kodza:add`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-event-schedule {
    --kz-event-schedule-bg: #161616;
    --kz-event-schedule-fg: #f2f2f0;
    --kz-event-schedule-muted: rgba(242, 242, 240, 0.62);
    --kz-event-schedule-border: rgba(255, 255, 255, 0.12);
    --kz-event-schedule-soft: rgba(255, 255, 255, 0.08);
    --kz-event-schedule-hover: rgba(255, 255, 255, 0.05);
    --kz-event-schedule-dot: rgba(255, 255, 255, 0.3);
    --kz-event-schedule-ink: #f2f2f0;
    --kz-event-schedule-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a day tab | `ArrowLeft` / `ArrowRight` | Goes to the previous or next day |
|  | `Home` / `End` | Goes to the first or last day |
| On a session title | `Enter` / `Space` | Opens or closes its summary |
| On Add to calendar | `Enter` / `Space` | Saves the session as an .ics file |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
