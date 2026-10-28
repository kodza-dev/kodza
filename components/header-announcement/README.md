# Header Announcement

[![Header Announcement, live on kodza.dev](https://kodza.dev/anim/header-announcement/og.jpg)](https://kodza.dev/components/header-announcement/)

A site header with a strip of news on top: messages roll and pause on hover or focus; the cross folds the strip, the header slides up without a jump, and it stays closed. Below 900 px, a shutter menu.

**[Live demo](https://kodza.dev/components/header-announcement/)** · Header · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-header-announcement.html`](kodza-header-announcement.html) | 2.6 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-header-announcement.css`](kodza-header-announcement.css) | 43.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-header-announcement.js`](kodza-header-announcement.js) | 17.0 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-header-announcement.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-header-announcement.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/header-announcement/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Header Announcement to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-header-announcement` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-header-announcement-bg` | `transparent` |  |
| `--kz-header-announcement-fg` | `#0a0a0a` |  |
| `--kz-header-announcement-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-header-announcement-soft` | `rgba(10, 10, 10, 0.06)` | the Menu button |
| `--kz-header-announcement-ink` | `#0a0a0a` | the call to action |
| `--kz-header-announcement-on-ink` | `#ffffff` |  |
| `--kz-header-announcement-height` | `72px` |  |
| `--kz-header-announcement-width` | `1200px` | the row, centred |
| `--kz-header-announcement-pad` | `24px` |  |
| `--kz-header-announcement-strip-bg` | `#0a0a0a` | the strip of news |
| `--kz-header-announcement-strip-fg` | `#f2f2f0` |  |
| `--kz-header-announcement-strip-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-header-announcement-strip-height` | `40px` |  |
| `--kz-header-announcement-interval` | `4.5s` | how long each message stays |
| `--kz-header-announcement-roll` | `0.7s` | one message rolling to the next |
| `--kz-header-announcement-fold` | `0.6s` | the strip folding away |
| `--kz-header-announcement-menu-bg` | `#0a0a0a` | the shutter, below 900 px |
| `--kz-header-announcement-menu-fg` | `#f2f2f0` |  |
| `--kz-header-announcement-menu-muted` | `rgba(242, 242, 240, 0.62)` |  |
| `--kz-header-announcement-menu-line` | `rgba(242, 242, 240, 0.16)` |  |
| `--kz-header-announcement-menu-top` | `auto` | where the shutter starts; auto = the bottom of the header |
| `--kz-header-announcement-menu-side` | `24px` |  |
| `--kz-header-announcement-menu-size` | `clamp(34px, min(10cqw, calc((100cqh - 240px) / 6)), 96px)` |  |
| `--kz-header-announcement-menu-duration` | `0.8s` |  |
| `--kz-header-announcement-menu-ease` | `cubic-bezier(0.76, 0, 0.24, 1)` |  |

- Attributes: `data-key`, `data-remember`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-header-announcement {
    --kz-header-announcement-strip-bg: #f2f2f0;
    --kz-header-announcement-strip-fg: #0a0a0a;
    --kz-header-announcement-strip-muted: rgba(10, 10, 10, 0.62);
    --kz-header-announcement-fg: #f2f2f0;
    --kz-header-announcement-muted: rgba(242, 242, 240, 0.62);
    --kz-header-announcement-soft: rgba(255, 255, 255, 0.08);
    --kz-header-announcement-ink: #f2f2f0;
    --kz-header-announcement-on-ink: #0a0a0a;
    --kz-header-announcement-menu-bg: #f2f2f0;
    --kz-header-announcement-menu-fg: #0a0a0a;
    --kz-header-announcement-menu-muted: rgba(10, 10, 10, 0.62);
    --kz-header-announcement-menu-line: rgba(10, 10, 10, 0.14);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the header. The strip has its own three (--kz-header-announcement-strip-bg, -strip-fg, -strip-muted): the demo's dark band turns it to paper. Set -fg, -muted, -soft, -ink and -on-ink for a light bar on a dark site, and the --kz-header-announcement-menu-* set (bg, fg, muted, line) for the shutter.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the cross of the strip | `Enter` / `Space` | Folds the strip away, focus moves on to the logo |
| On the Menu button, below 900 px | `Enter` / `Space` | Opens or closes the shutter |
| In the shutter | `Escape` | Rolls it back up, focus back on Menu |
|  | `Tab` | Past the last link, rolls it up and goes on with the page |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
