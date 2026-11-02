# Header Grid

[![Header Grid, live on kodza.dev](https://kodza.dev/anim/header-grid/og.jpg)](https://kodza.dev/components/header-grid/)

A site header placed on your grid: brand, links and actions each take the columns you name, one link per column if you like. Still by default; a gliding line, hide on scroll or tighten on scroll as options.

**[Live demo](https://kodza.dev/components/header-grid/)** · Header · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-header-grid.html`](kodza-header-grid.html) | 1.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-header-grid.css`](kodza-header-grid.css) | 51.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-header-grid.js`](kodza-header-grid.js) | 22.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-header-grid.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-header-grid.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/header-grid/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Header Grid to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-header-grid` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-header-grid-bg` | `transparent` | give it your page colour once it sticks |
| `--kz-header-grid-fg` | `#0a0a0a` | the brand, the page you are on, the link you point at |
| `--kz-header-grid-muted` | `rgba(10, 10, 10, 0.62)` | the notes |
| `--kz-header-grid-link` | `var(--kz-header-grid-muted)` | the other links |
| `--kz-header-grid-rule-color` | `var(--kz-header-grid-fg)` | the rules under the cells |
| `--kz-header-grid-ink` | `#0a0a0a` | the buttons |
| `--kz-header-grid-on-ink` | `#ffffff` |  |
| `--kz-header-grid-soft` | `rgba(10, 10, 10, 0.06)` | the Menu button |
| `--kz-header-grid-columns` | `minmax(0, 1fr) auto minmax(0, 1fr)` | an auto column centres what it holds |
| `--kz-header-grid-gap` | `16px` | between the columns |
| `--kz-header-grid-brand-column` | `1` |  |
| `--kz-header-grid-nav-column` | `2` |  |
| `--kz-header-grid-actions-column` | `3` |  |
| `--kz-header-grid-align` | `center` | end sets every zone on the bottom edge |
| `--kz-header-grid-width` | `1200px` | the row, centred; none = the full width |
| `--kz-header-grid-pad` | `clamp(16px, 4cqw, 24px)` | on both sides |
| `--kz-header-grid-pad-block` | `0px` | above and below (two values: above, then below) |
| `--kz-header-grid-height` | `72px` | at least |
| `--kz-header-grid-brand-size` | `18px` |  |
| `--kz-header-grid-mark` | `1.5px` | the line under it, and under the link you point at |
| `--kz-header-grid-rule` | `0px` | with --cells, the rule under every cell; 0 = none |
| `--kz-header-grid-position` | `static` | sticky keeps it at the top |
| `--kz-header-grid-top` | `var(--wp-admin--admin-bar--height, 0px)` | where it sticks: under the WordPress admin bar |
| `--kz-header-grid-breakpoint` | `900px` | below it, data-mobile takes over |
| `--kz-header-grid-duration` | `0.42s` | --line: the line gliding |
| `--kz-header-grid-lag` | `0.08s` | how long its back edge waits |
| `--kz-header-grid-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-header-grid-hide-after` | `600px` | --hide: how far you read before it goes |
| `--kz-header-grid-tighten` | `16px` | --tighten: the height the bar loses |
| `--kz-header-grid-tighten-after` | `40px` | how far you scroll before it tightens |
| `--kz-header-grid-shrink` | `0.86` | the brand's size once tight; 1 = it stays |
| `--kz-header-grid-menu-bg` | `#0a0a0a` |  |
| `--kz-header-grid-menu-fg` | `#f2f2f0` |  |
| `--kz-header-grid-menu-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-header-grid-menu-line` | `rgba(242, 242, 240, 0.16)` |  |
| `--kz-header-grid-menu-side` | `24px` |  |
| `--kz-header-grid-menu-size` | `calc(clamp(34px, min(10cqw, calc((100cqh - 240px) / 6)), 96px) * var(--kz-font-display-scale, 1))` |  |
| `--kz-header-grid-menu-duration` | `0.8s` |  |
| `--kz-header-grid-menu-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |

- Modifiers: `.kodza-header-grid--cells`, `.kodza-header-grid--hide`, `.kodza-header-grid--line`, `.kodza-header-grid--tighten`
- Attributes: `data-mobile` (e.g. `menu`, `wrap`, `scroll`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-header-grid {
    --kz-header-grid-fg: #f2f2f0;
    --kz-header-grid-muted: rgba(242, 242, 240, 0.62);
    --kz-header-grid-soft: rgba(255, 255, 255, 0.08);
    --kz-header-grid-ink: #f2f2f0;
    --kz-header-grid-on-ink: #0a0a0a;
    --kz-header-grid-menu-bg: #f2f2f0;
    --kz-header-grid-menu-fg: #0a0a0a;
    --kz-header-grid-menu-muted: rgba(10, 10, 10, 0.62);
    --kz-header-grid-menu-line: rgba(10, 10, 10, 0.14);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the header: set --kz-header-grid-fg, -muted, -soft, -ink and -on-ink for a light bar on a dark site (the demo's dark band has the recipe), and -bg once it sticks. The shutter has its own --kz-header-grid-menu-* set (bg, fg, muted, line), so it can stay dark or turn to paper.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the Menu button, below the breakpoint | `Enter` / `Space` | Opens or closes the shutter |
| In the shutter | `Escape` | Rolls it back up, focus back on Menu |
|  | `Tab` | Past the last link, rolls it up and goes on with the page |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
