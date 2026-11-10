# Open Roles

[![Open Roles, live on kodza.dev](https://kodza.dev/anim/open-roles/og.jpg)](https://kodza.dev/components/open-roles/)

A careers section: open roles grouped by team with a count per team, each role a row link with its location and contract, an arrow that draws in on hover and focus, and an empty state with an email when nothing is open.

**[Live demo](https://kodza.dev/components/open-roles/)** · Team & about · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-open-roles.html`](kodza-open-roles.html) | 5.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-open-roles.css`](kodza-open-roles.css) | 27.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-open-roles.js`](kodza-open-roles.js) | 5.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-open-roles.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-open-roles.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/open-roles/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Open Roles to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-open-roles]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-open-roles-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-open-roles-muted` | `color-mix(in srgb, var(--kz-open-roles-ink) 62%, transparent)` |  |
| `--kz-open-roles-dim` | `color-mix(in srgb, var(--kz-open-roles-ink) 26%, transparent)` |  |
| `--kz-open-roles-line` | `color-mix(in srgb, var(--kz-open-roles-ink) 12%, transparent)` |  |
| `--kz-open-roles-pill` | `var(--kz-color-accent, var(--kz-open-roles-ink))` | the email button |
| `--kz-open-roles-on-pill` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-open-roles-width` | `var(--kz-page-width, 1440px)` |  |
| `--kz-open-roles-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` |  |
| `--kz-open-roles-space` | `clamp(56px, 7vw, 112px)` | above and below the section |
| `--kz-open-roles-gap` | `clamp(32px, 6vw, 96px)` | between the two columns of the head |
| `--kz-open-roles-split` | `minmax(0, 4fr) minmax(0, 8fr)` | the team, then its roles |
| `--kz-open-roles-columns` | `minmax(0, 1fr) minmax(0, 150px) minmax(0, 110px) 16px` | title, place, contract, arrow |
| `--kz-open-roles-size` | `calc(clamp(20px, 2vw, 26px) * var(--kz-font-display-scale, 1))` | a role's title |
| `--kz-open-roles-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-open-roles-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Attributes: `data-kodza-open-roles`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-open-roles {
    --kz-open-roles-ink: #f2f2f0;
    --kz-open-roles-muted: rgba(242, 242, 240, 0.62);
    --kz-open-roles-dim: rgba(242, 242, 240, 0.26);
    --kz-open-roles-line: rgba(255, 255, 255, 0.12);
    --kz-open-roles-pill: #f2f2f0;
    --kz-open-roles-on-pill: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
