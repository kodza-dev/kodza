# Footer Contact

[![Footer Contact, live on kodza.dev](https://kodza.dev/anim/footer-contact/og.jpg)](https://kodza.dev/components/footer-contact/)

A freelance or studio footer: the email address across the whole width, copied on a click while the line under it rolls to Copied, the local time to the minute, the networks in big rows.

**[Live demo](https://kodza.dev/components/footer-contact/)** · Footer · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-footer-contact.html`](kodza-footer-contact.html) | 3.9 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-footer-contact.css`](kodza-footer-contact.css) | 29.4 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-footer-contact.js`](kodza-footer-contact.js) | 12.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-footer-contact.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-footer-contact.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/footer-contact/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Footer Contact to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-footer-contact` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-footer-contact-bg` | `#ffffff` |  |
| `--kz-footer-contact-fg` | `#0a0a0a` |  |
| `--kz-footer-contact-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-footer-contact-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-footer-contact-width` | `1200px` | the content, centred |
| `--kz-footer-contact-pad` | `24px` |  |
| `--kz-footer-contact-weight` | `500` | the address |
| `--kz-footer-contact-tracking` | `-0.05em` |  |
| `--kz-footer-contact-mono` | `"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace` |  |
| `--kz-footer-contact-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-copied` (e.g. `Copied. Talk soon.`), `data-copy` (e.g. `hello@pier.example`), `data-failed` (e.g. `This page can't copy. Use the mail app.`), `data-icon`, `data-timezone` (e.g. `Europe/Paris`)
- Events: `kodza:copy`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-footer-contact {
    --kz-footer-contact-bg: #141414;
    --kz-footer-contact-fg: #f2f2f0;
    --kz-footer-contact-muted: rgba(242, 242, 240, 0.62);
    --kz-footer-contact-line: rgba(255, 255, 255, 0.12);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the footer: set --kz-footer-contact-bg, -fg, -muted and -line (the demo's dark band has the recipe). The copy line and the rows follow -fg.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On the address | `Enter` / `Space` | Copies the address; the line under it rolls to Copied |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
