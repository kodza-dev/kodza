# Profile Card

[![Profile Card, live on kodza.dev](https://kodza.dev/anim/profile-card/og.jpg)](https://kodza.dev/components/profile-card/)

A person you can reach: portrait, role, the time where they are rolling on the minute, whether they take calls now, real links, and Save contact writing a .vcf with the photo. Author box variant.

**[Live demo](https://kodza.dev/components/profile-card/)** · Cards · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-profile-card.html`](kodza-profile-card.html) | 3.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-profile-card.css`](kodza-profile-card.css) | 30.8 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-profile-card.js`](kodza-profile-card.js) | 21.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-profile-card.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-profile-card.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/profile-card/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Profile Card to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-profile-card]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-profile-card-bg` | `var(--kz-color-paper, #ffffff)` |  |
| `--kz-profile-card-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-profile-card-muted` | `color-mix(in srgb, var(--kz-profile-card-fg) 62%, transparent)` |  |
| `--kz-profile-card-rule` | `color-mix(in srgb, var(--kz-profile-card-fg) 14%, transparent)` |  |
| `--kz-profile-card-border` | `color-mix(in srgb, var(--kz-profile-card-fg) 10%, transparent)` |  |
| `--kz-profile-card-shade` | `color-mix(in srgb, var(--kz-profile-card-fg) 6%, transparent)` | behind the portrait |
| `--kz-profile-card-radius` | `calc(16px * var(--kz-radius-scale, 1))` |  |
| `--kz-profile-card-pad` | `28px` |  |
| `--kz-profile-card-portrait` | `88px` | the portrait's width, 4:5 |
| `--kz-profile-card-author-portrait` | `112px` |  |
| `--kz-profile-card-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |
| `--kz-profile-card-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |

- Modifiers: `.kodza-profile-card--author`
- Attributes: `data-hours` (e.g. `mon-fri 09:00-18:30`), `data-kodza-profile-card`, `data-timezone` (e.g. `Europe/Lisbon`)
- Events: `kodza:save`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-profile-card {
    --kz-profile-card-bg: #161616;
    --kz-profile-card-fg: #f2f2f0;
    --kz-profile-card-border: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On Save contact | `Enter` / `Space` | Saves the contact as a .vcf file, photo included |

## Images

The images are Kodza house images, free to use in what you ship ([Kodza License](../../LICENSE)). The code loads them from kodza.dev, whose addresses can change: keep your own copy in your project.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
