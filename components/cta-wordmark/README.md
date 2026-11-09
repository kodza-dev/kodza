# CTA Wordmark

[![CTA Wordmark, live on kodza.dev](https://kodza.dev/anim/cta-wordmark/og.jpg)](https://kodza.dev/components/cta-wordmark/)

The call at the end of a page, set across the whole width: two or three words sized to fill the line, rising one by one, a picture laid over the foot of the letters, and a button or an email field below.

**[Live demo](https://kodza.dev/components/cta-wordmark/)** · CTA & Newsletter · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-cta-wordmark.html`](kodza-cta-wordmark.html) | 1.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-cta-wordmark.css`](kodza-cta-wordmark.css) | 36.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-cta-wordmark.js`](kodza-cta-wordmark.js) | 18.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-cta-wordmark.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-cta-wordmark.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/cta-wordmark/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza CTA Wordmark to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-cta-wordmark` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-cta-wordmark-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-cta-wordmark-faint` | `color-mix(in srgb, var(--kz-cta-wordmark-ink) 60%, transparent)` | the label, the line under the button |
| `--kz-cta-wordmark-bg` | `transparent` |  |
| `--kz-cta-wordmark-accent` | `var(--kz-color-accent, var(--kz-cta-wordmark-ink))` | the button |
| `--kz-cta-wordmark-on-accent` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-cta-wordmark-accent-hover` | `color-mix(in srgb, var(--kz-cta-wordmark-accent) 86.94%, var(--kz-cta-wordmark-on-accent))` |  |
| `--kz-cta-wordmark-field` | `var(--kz-color-paper, #ffffff)` | the email field of --subscribe |
| `--kz-cta-wordmark-line` | `color-mix(in srgb, var(--kz-cta-wordmark-ink) 14%, transparent)` |  |
| `--kz-cta-wordmark-line-hover` | `color-mix(in srgb, var(--kz-cta-wordmark-ink) 30%, transparent)` |  |
| `--kz-cta-wordmark-halo` | `color-mix(in srgb, var(--kz-cta-wordmark-ink) 4%, transparent)` |  |
| `--kz-cta-wordmark-error` | `var(--kz-color-error, var(--kz-cta-wordmark-ink))` | monochrome by default: an icon and a message, never colour alone |
| `--kz-cta-wordmark-width` | `var(--kz-page-width, 1440px)` | the content column: the page's, set by the site |
| `--kz-cta-wordmark-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-cta-wordmark-pad-top` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-cta-wordmark-pad-bottom` | `clamp(56px, 7vw, 112px)` |  |
| `--kz-cta-wordmark-photo-width` | `22%` | of the column |
| `--kz-cta-wordmark-photo-x` | `0.78` | where it sits: 0 on the left edge, 1 on the right edge |
| `--kz-cta-wordmark-overlap` | `0.3` | how much of the letters' height it covers, a third at most |
| `--kz-cta-wordmark-ratio` | `4 / 5` |  |
| `--kz-cta-wordmark-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-cta-wordmark-field-width` | `var(--kz-field-width, 440px)` |  |
| `--kz-cta-wordmark-weight` | `var(--kz-font-display-weight, 600)` |  |
| `--kz-cta-wordmark-tracking` | `var(--kz-font-display-tracking, -0.045em)` |  |
| `--kz-cta-wordmark-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-cta-wordmark-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-cta-wordmark-swap` | `cubic-bezier(0.65, 0, 0.35, 1)` | the field leaving, the thanks arriving |

- Attributes: `data-error`, `data-fail`, `data-failed`, `data-state` (e.g. `sending`, `done`)
- Events: `kodza:subscribe`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-cta-wordmark {
    --kz-cta-wordmark-ink: #f2f2f0;
    --kz-cta-wordmark-faint: rgba(242, 242, 240, 0.6);
    --kz-cta-wordmark-on-accent: #0a0a0a;
    --kz-cta-wordmark-accent-hover: #d6d6d4;
    --kz-cta-wordmark-field: #161616;
    --kz-cta-wordmark-line: rgba(255, 255, 255, 0.14);
    --kz-cta-wordmark-line-hover: rgba(255, 255, 255, 0.3);
    --kz-cta-wordmark-halo: rgba(255, 255, 255, 0.06);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the field | `Enter` | Sends the address, or says what is wrong with it |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
