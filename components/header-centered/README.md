# Header Centered

[![Header Centered, live on kodza.dev](https://kodza.dev/anim/header-centered/og.jpg)](https://kodza.dev/components/header-centered/)

A centred header for a restaurant or a shop: the name in the middle, links on both sides, a line above that says whether it's open now. On scroll the bar tightens; below 900 px, a full-screen menu.

**[Live demo](https://kodza.dev/components/header-centered/)** · Header · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-header-centered.html`](kodza-header-centered.html) | 3.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-header-centered.css`](kodza-header-centered.css) | 43.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-header-centered.js`](kodza-header-centered.js) | 44.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-header-centered.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-header-centered.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/header-centered/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Header Centered to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-header-centered` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-header-centered-bg` | `#f2f2f0` |  |
| `--kz-header-centered-fg` | `#0a0a0a` |  |
| `--kz-header-centered-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-header-centered-soft` | `rgba(10, 10, 10, 0.06)` | the Menu button |
| `--kz-header-centered-rule` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-header-centered-cta-bg` | `#0a0a0a` |  |
| `--kz-header-centered-cta-fg` | `#ffffff` |  |
| `--kz-header-centered-mono` | `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` |  |
| `--kz-header-centered-top` | `var(--wp-admin--admin-bar--height, 0px)` | below the WordPress admin bar |
| `--kz-header-centered-strip` | `36px` | the line with the address and the hours |
| `--kz-header-centered-height` | `84px` | the bar at the top of the page |
| `--kz-header-centered-compact` | `64px` | the bar once you scroll |
| `--kz-header-centered-shrink` | `0.74` | the name's size once you scroll |
| `--kz-header-centered-phone-height` | `68px` | the same three, below 900 px |
| `--kz-header-centered-phone-compact` | `56px` |  |
| `--kz-header-centered-phone-shrink` | `0.84` |  |
| `--kz-header-centered-after` | `40px` | how far you scroll before it tightens |
| `--kz-header-centered-width` | `1200px` | the row, centred |
| `--kz-header-centered-pad` | `24px` |  |
| `--kz-header-centered-duration` | `0.6s` |  |
| `--kz-header-centered-ease` | `cubic-bezier(0.33, 1, 0.68, 1)` |  |
| `--kz-header-centered-menu-bg` | `#0a0a0a` |  |
| `--kz-header-centered-menu-fg` | `#f2f2f0` |  |
| `--kz-header-centered-menu-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-header-centered-menu-top` | `calc(var(--wp-admin--admin-bar--height, 0px) + 18px)` | Close lands on Menu on its own; this is where it goes if Menu is somewhere else |
| `--kz-header-centered-menu-side` | `24px` |  |
| `--kz-header-centered-menu-size` | `clamp(40px, min(10cqw + 12px, calc((100cqh - 230px) / 5.3)), 132px)` |  |
| `--kz-header-centered-menu-curve` | `1` | how far the edge bends on the way; 0 = a straight edge |
| `--kz-header-centered-menu-shade` | `0.5` | how dark the page gets under it |
| `--kz-header-centered-menu-depth` | `0.94` | the page's size once covered |
| `--kz-header-centered-menu-duration` | `1s` |  |
| `--kz-header-centered-menu-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |
| `--kz-header-centered-page` | `auto` | the page colour while it backs off; auto = the first background above it |

- Attributes: `data-hours` (e.g. `mon closed; tue-thu 12:00-14:30, 19:00-22:30; fri-sat 12:00-14:30, 19:00-23:30; sun 12:00-15:30`), `data-now`, `data-page`, `data-soon`, `data-timezone` (e.g. `Europe/Paris`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-header-centered {
    --kz-header-centered-bg: #0a0a0a;
    --kz-header-centered-fg: #f2f2f0;
    --kz-header-centered-muted: rgba(242, 242, 240, 0.62);
    --kz-header-centered-soft: rgba(242, 242, 240, 0.08);
    --kz-header-centered-rule: rgba(242, 242, 240, 0.12);
    --kz-header-centered-cta-bg: #f2f2f0;
    --kz-header-centered-cta-fg: #0a0a0a;
    --kz-header-centered-menu-bg: #f2f2f0;
    --kz-header-centered-menu-fg: #0a0a0a;
    --kz-header-centered-menu-muted: rgba(10, 10, 10, 0.62);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the header: --kz-header-centered-bg, -fg, -muted, -soft, -rule, -cta-bg and -cta-fg. Set those for an ink bar on a dark site. The curtain has its own --kz-header-centered-menu-* set (bg, fg, muted), so it can turn to paper.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the Menu button, below 900 px | `Enter` / `Space` | Opens the curtain on the current link, or the first |
| In the curtain | `ArrowDown` / `ArrowUp` | Next or previous link, round and round |
|  | `Home` / `End` | First or last link |
|  | `Tab` / `Shift+Tab` | Stays inside the curtain, round and round |
|  | `PageUp` / `PageDown` | Held back, the page behind stays put |
| Anywhere, while it's open | `Escape` | Lifts the curtain, focus back on Menu |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
