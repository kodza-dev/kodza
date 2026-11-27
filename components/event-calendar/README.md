# Event Calendar

[![Event Calendar, live on kodza.dev](https://kodza.dev/anim/event-calendar/og.jpg)](https://kodza.dev/components/event-calendar/)

A month drawn from a list of events: a dot per event under its day, an ink mark that glides to the chosen day while its events roll in beside the grid, arrows that slide the months, and a List view of what's next.

**[Live demo](https://kodza.dev/components/event-calendar/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-event-calendar.html`](kodza-event-calendar.html) | 8.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-event-calendar.css`](kodza-event-calendar.css) | 48.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-event-calendar.js`](kodza-event-calendar.js) | 31.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-event-calendar.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-event-calendar.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/event-calendar/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Event Calendar to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-event-calendar` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-event-calendar-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-event-calendar-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-event-calendar-muted` | `color-mix(in srgb, var(--kz-event-calendar-fg) 60%, transparent)` |  |
| `--kz-event-calendar-border` | `color-mix(in srgb, var(--kz-event-calendar-fg) 10%, transparent)` |  |
| `--kz-event-calendar-soft` | `color-mix(in srgb, var(--kz-event-calendar-fg) 6%, transparent)` | a day or an arrow, hovered |
| `--kz-event-calendar-ink` | `var(--kz-color-accent, var(--kz-event-calendar-fg))` | the dots, the chosen day, today's ring |
| `--kz-event-calendar-on-ink` | `var(--kz-color-on-accent, var(--kz-event-calendar-bg))` | on the chosen day |
| `--kz-event-calendar-cell` | `46px` | the height of a day |
| `--kz-event-calendar-gap` | `32px` | between two months, and between the month and its list |
| `--kz-event-calendar-pad` | `28px` |  |
| `--kz-event-calendar-time` | `104px` | the time column of the day's list |
| `--kz-event-calendar-mono` | `var(--kz-font-mono, ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-event-calendar-stagger` | `18ms` | the delay from one dot to the next |
| `--kz-event-calendar-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-from`, `data-kodza-event-calendar`, `data-locale` (e.g. `en-GB`), `data-until`, `data-week-start`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-event-calendar {
    --kz-event-calendar-bg: #161616;
    --kz-event-calendar-fg: #f2f2f0;
    --kz-event-calendar-muted: rgba(242, 242, 240, 0.6);
    --kz-event-calendar-border: rgba(255, 255, 255, 0.12);
    --kz-event-calendar-soft: rgba(255, 255, 255, 0.08);
    --kz-event-calendar-ink: #f2f2f0;
    --kz-event-calendar-on-ink: #161616;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a day | `ArrowLeft` / `ArrowRight` | Goes to the previous or next day, across months |
|  | `ArrowUp` / `ArrowDown` | Goes to the same day a week before or after |
|  | `Home` / `End` | Goes to the first or last day of the week |
|  | `PageUp` / `PageDown` | Goes to the previous or next month |
| On the Month / List switch | `ArrowLeft` / `ArrowRight` | Switches between the month and the list |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
