# Soft Swap

[![Soft Swap, live on kodza.dev](https://kodza.dev/anim/soft-swap/og.jpg)](https://kodza.dev/components/soft-swap/)

Between two real pages, the one you leave fades out drifting up while the next slides in from just below, and the header stays put. CSS only, no script. Chrome, Edge, Safari; Firefox loads plainly for now.

**[Live demo](https://kodza.dev/components/soft-swap/)** · Preloaders & transitions · HTML and CSS only · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-soft-swap.html`](kodza-soft-swap.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-soft-swap.css`](kodza-soft-swap.css) | 4.3 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-soft-swap.css">`
2. Paste the HTML where the component goes.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/soft-swap/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Soft Swap to my page.

Your AI gets these exact files, not its best guess, and where they go.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
