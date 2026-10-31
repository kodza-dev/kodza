# Typewriter

[![Typewriter, live on kodza.dev](https://kodza.dev/anim/typewriter-effect/og.jpg)](https://kodza.dev/components/typewriter-effect/)

Phrases typed with a human rhythm and an honest caret. Retypes only what changes, or selects it like an editor before typing over it.

**[Live demo](https://kodza.dev/components/typewriter-effect/)** · Text effects · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-typewriter-effect.html`](kodza-typewriter-effect.html) | 0.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-typewriter-effect.css`](kodza-typewriter-effect.css) | 2.2 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-typewriter-effect.js`](kodza-typewriter-effect.js) | 9.4 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-typewriter-effect.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-typewriter-effect.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/typewriter-effect/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Type my hero tagline with the Kodza Typewriter.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-typewriter` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-type-caret` | `currentColor` |  |
| `--kz-type-selection` | `rgba(10, 10, 10, 0.14)` |  |

- Attributes: `data-hold`, `data-mode` (e.g. `retype`, `select`), `data-speed`, `data-words` (e.g. `["No framework needed.", "Just HTML, CSS and JS.", "Copy. Paste. Ship."]`, `["It works on my machine.", "It works on your machine.", "It works on every machine."]`, `["Ship it on Friday.", "Ship it on Monday.", "Ship it someday."]`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-typewriter {
    --kz-type-selection: rgba(255, 255, 255, 0.22);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
