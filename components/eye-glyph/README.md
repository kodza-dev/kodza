# Eye Glyph

[![Eye Glyph, live on kodza.dev](https://kodza.dev/anim/eye-glyph/og.jpg)](https://kodza.dev/components/eye-glyph/)

Any letter with a hole becomes an eye: the pupil follows the pointer, lashes grow on top, and real lids close it when it blinks. Poke one and it winks.

**[Live demo](https://kodza.dev/components/eye-glyph/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-eye-glyph.html`](kodza-eye-glyph.html) | 0.2 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-eye-glyph.css`](kodza-eye-glyph.css) | 8.0 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-eye-glyph.js`](kodza-eye-glyph.js) | 18.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-eye-glyph.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-eye-glyph.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/eye-glyph/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Eye Glyph to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-eye-glyph]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-eye-glyph-ink` | `#0a0a0a` |  |
| `--kz-eye-glyph-pupil` | `0.55` | pupil size, from the narrow side of the hole |
| `--kz-eye-glyph-lashes` | `1` | lash length; 0 hides them |
| `--kz-eye-glyph-blink` | `340ms` |  |
| `--kz-eye-glyph-every` | `4.2s` | average time between two blinks |

- Attributes: `data-kodza-eye-glyph`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-eye-glyph {
    --kz-eye-glyph-ink: #f2f2f0;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
