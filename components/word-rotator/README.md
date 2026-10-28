# Word Rotator

[![Word Rotator, live on kodza.dev](https://kodza.dev/anim/word-rotator/og.jpg)](https://kodza.dev/components/word-rotator/)

One word of a sentence keeps changing: the next one's letters rise as the old ones leave, or the word flips over. The space follows the word, the sentence moves along.

**[Live demo](https://kodza.dev/components/word-rotator/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-word-rotator.html`](kodza-word-rotator.html) | 0.4 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-word-rotator.css`](kodza-word-rotator.css) | 2.7 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-word-rotator.js`](kodza-word-rotator.js) | 6.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-word-rotator.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-word-rotator.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/word-rotator/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Rotate the last word of my hero title with Kodza Word Rotator.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-rotator` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-rotator-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-rotator--flip`
- Attributes: `data-interval`

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
