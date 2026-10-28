# Footer Minimal

[![Footer Minimal, live on kodza.dev](https://kodza.dev/anim/footer-minimal/og.jpg)](https://kodza.dev/components/footer-minimal/)

A one-line site footer: the logo, the ©, three links and Back to top, whose arrow rolls up on hover and which scrolls up smoothly; on phones, two centred lines.

**[Live demo](https://kodza.dev/components/footer-minimal/)** · Footer · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-footer-minimal.html`](kodza-footer-minimal.html) | 1.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-footer-minimal.css`](kodza-footer-minimal.css) | 17.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-footer-minimal.js`](kodza-footer-minimal.js) | 4.8 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-footer-minimal.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-footer-minimal.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/footer-minimal/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Footer Minimal to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-footer-minimal` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-footer-minimal-bg` | `#ffffff` |  |
| `--kz-footer-minimal-fg` | `#0a0a0a` |  |
| `--kz-footer-minimal-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-footer-minimal-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-footer-minimal-soft` | `rgba(10, 10, 10, 0.05)` | Back to top, under the pointer |
| `--kz-footer-minimal-width` | `1200px` | the line, centred |
| `--kz-footer-minimal-pad` | `24px` |  |
| `--kz-footer-minimal-mono` | `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` |  |
| `--kz-footer-minimal-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-footer-minimal {
    --kz-footer-minimal-bg: #141414;
    --kz-footer-minimal-fg: #f2f2f0;
    --kz-footer-minimal-muted: rgba(242, 242, 240, 0.62);
    --kz-footer-minimal-line: rgba(255, 255, 255, 0.12);
    --kz-footer-minimal-soft: rgba(255, 255, 255, 0.08);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the footer: set --kz-footer-minimal-bg, -fg, -muted, -line and -soft (the demo's dark band has the recipe).

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On Back to top | `Enter` | Back to the top, focus too: Tab starts there |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
