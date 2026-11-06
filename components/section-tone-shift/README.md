# Section Tone Shift

[![Section Tone Shift, live on kodza.dev](https://kodza.dev/anim/section-tone-shift/og.jpg)](https://kodza.dev/components/section-tone-shift/)

The page turns from paper to ink as a marked section takes the middle of the screen, the colour following the scroll. The text changes side halfway, and an event tells your header.

**[Live demo](https://kodza.dev/components/section-tone-shift/)** · Scroll · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-section-tone-shift.html`](kodza-section-tone-shift.html) | 2.7 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-section-tone-shift.css`](kodza-section-tone-shift.css) | 22.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-section-tone-shift.js`](kodza-section-tone-shift.js) | 10.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-section-tone-shift.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-section-tone-shift.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/section-tone-shift/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Section Tone Shift to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-section-tone-shift]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-section-tone-shift-from` | `var(--kz-color-page, #f2f2f0)` |  |
| `--kz-section-tone-shift-from-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-section-tone-shift-from-muted` | `color-mix(in srgb, var(--kz-section-tone-shift-from-ink) 66%, transparent)` |  |
| `--kz-section-tone-shift-from-line` | `color-mix(in srgb, var(--kz-section-tone-shift-from-ink) 14%, transparent)` |  |
| `--kz-section-tone-shift-to` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-section-tone-shift-to-ink` | `var(--kz-color-page, #f2f2f0)` |  |
| `--kz-section-tone-shift-to-muted` | `color-mix(in srgb, var(--kz-section-tone-shift-to-ink) 66%, transparent)` |  |
| `--kz-section-tone-shift-to-line` | `color-mix(in srgb, var(--kz-section-tone-shift-to-ink) 16%, transparent)` |  |
| `--kz-section-tone-shift-duration` | `0.3s` |  |
| `--kz-section-tone-shift-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` |  |
| `--kz-section-tone-shift-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace)` |  |
| `--kz-section-tone-shift-bg` | `var(--kz-section-tone-shift-from)` |  |
| `--kz-section-tone-shift-ink` | `var(--kz-section-tone-shift-from-ink)` |  |
| `--kz-section-tone-shift-muted` | `var(--kz-section-tone-shift-from-muted)` |  |
| `--kz-section-tone-shift-line` | `var(--kz-section-tone-shift-from-line)` |  |

- Attributes: `data-kodza-section-tone-shift`, `data-tone-shift`
- Events: `kodza:tone`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-section-tone-shift {
    --kz-section-tone-shift-from: #0a0a0a;
    --kz-section-tone-shift-from-ink: #f2f2f0;
    --kz-section-tone-shift-from-muted: rgba(242, 242, 240, 0.66);
    --kz-section-tone-shift-from-line: rgba(242, 242, 240, 0.16);
    --kz-section-tone-shift-to: #f2f2f0;
    --kz-section-tone-shift-to-ink: #0a0a0a;
    --kz-section-tone-shift-to-muted: rgba(10, 10, 10, 0.66);
    --kz-section-tone-shift-to-line: rgba(10, 10, 10, 0.14);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
