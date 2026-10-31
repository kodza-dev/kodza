# Footer Shop

[![Footer Shop, live on kodza.dev](https://kodza.dev/anim/footer-shop/og.jpg)](https://kodza.dev/components/footer-shop/)

A shop footer: four promises with icons, a newsletter field whose button rolls to Subscribed, columns that fold on phones, a country and currency menu, the payment methods.

**[Live demo](https://kodza.dev/components/footer-shop/)** · Footer · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-footer-shop.html`](kodza-footer-shop.html) | 8.1 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-footer-shop.css`](kodza-footer-shop.css) | 54.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-footer-shop.js`](kodza-footer-shop.js) | 18.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-footer-shop.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-footer-shop.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/footer-shop/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Footer Shop to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-footer-shop` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-footer-shop-bg` | `#ffffff` |  |
| `--kz-footer-shop-fg` | `#0a0a0a` |  |
| `--kz-footer-shop-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-footer-shop-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-footer-shop-edge` | `rgba(10, 10, 10, 0.16)` | the field and the country button |
| `--kz-footer-shop-edge-hover` | `rgba(10, 10, 10, 0.32)` |  |
| `--kz-footer-shop-soft` | `rgba(10, 10, 10, 0.05)` | the highlight in the menu, a done button |
| `--kz-footer-shop-raised` | `#ffffff` | the field and the menu |
| `--kz-footer-shop-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |
| `--kz-footer-shop-width` | `1200px` | the content, centred |
| `--kz-footer-shop-pad` | `24px` |  |
| `--kz-footer-shop-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-footer-shop-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-footer-shop--big-icons`
- Attributes: `data-error` (e.g. `That does not look like an email.`), `data-failed` (e.g. `Couldn't reach the list. Try again in a minute.`), `data-sending` (e.g. `Sending`), `data-sent` (e.g. `Subscribed`)
- Events: `kodza:subscribe`, `kodza:select`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-footer-shop {
    --kz-footer-shop-bg: #141414;
    --kz-footer-shop-fg: #f2f2f0;
    --kz-footer-shop-muted: rgba(242, 242, 240, 0.62);
    --kz-footer-shop-line: rgba(255, 255, 255, 0.12);
    --kz-footer-shop-edge: rgba(255, 255, 255, 0.18);
    --kz-footer-shop-edge-hover: rgba(255, 255, 255, 0.36);
    --kz-footer-shop-soft: rgba(255, 255, 255, 0.08);
    --kz-footer-shop-raised: #1c1c1c;
    --kz-footer-shop-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.7);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

Every colour is a variable on the footer: set --kz-footer-shop-bg, -fg, -muted, -line, -edge, -edge-hover, -soft, -raised and -shadow (the demo's dark band has the recipe). -raised is the field and the menu: one step above -bg.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| In the email field | `Enter` | Subscribes, or says what is wrong with the address |
| On the country button | `Enter` / `Space` / `ArrowDown` | Opens the list on the current country |
|  | `ArrowUp` | Opens the list on the last country |
| In the country list | `ArrowDown` / `ArrowUp` | Next or previous country, round the end |
|  | `Home` / `End` | First or last country |
|  | a letter | Jumps to the next country starting with that letter |
|  | `Enter` | Goes to that country's store |
|  | `Tab` | Closes the list and moves on |
| While the country list is open | `Escape` | Closes it, focus back on the button |
| On a column title, on a phone | `Enter` / `Space` | Unfolds its links, or folds them back |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
