# Natural Language Form

[![Natural Language Form, live on kodza.dev](https://kodza.dev/anim/natural-language-form/og.jpg)](https://kodza.dev/components/natural-language-form/)

A contact form written as one sentence: blanks that grow with what is typed, words over real selects whose list opens in place. Sent, the sentence turns into the reply, the visitor's words travelling into it.

**[Live demo](https://kodza.dev/components/natural-language-form/)** · Contact · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-natural-language-form.html`](kodza-natural-language-form.html) | 4.5 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-natural-language-form.css`](kodza-natural-language-form.css) | 47.1 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-natural-language-form.js`](kodza-natural-language-form.js) | 31.2 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-natural-language-form.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-natural-language-form.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/natural-language-form/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Natural Language Form to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-natural-language-form` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-natural-language-form-width` | `var(--kz-page-width, 1440px)` | widest the section gets |
| `--kz-natural-language-form-measure` | `21em` | widest the sentence gets, in its own letters |
| `--kz-natural-language-form-fg` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-natural-language-form-muted` | `color-mix(in srgb, var(--kz-natural-language-form-fg) 62%, transparent)` | the empty blanks, the notes |
| `--kz-natural-language-form-line` | `color-mix(in srgb, var(--kz-natural-language-form-fg) 16%, transparent)` | under a blank |
| `--kz-natural-language-form-rule` | `color-mix(in srgb, var(--kz-natural-language-form-fg) 10%, transparent)` | the rules of the section |
| `--kz-natural-language-form-soft` | `color-mix(in srgb, var(--kz-natural-language-form-fg) 6%, transparent)` | a blank you are in, the highlight of a list |
| `--kz-natural-language-form-ink` | `var(--kz-color-accent, var(--kz-natural-language-form-fg))` | the send button |
| `--kz-natural-language-form-on-ink` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` |  |
| `--kz-natural-language-form-list` | `var(--kz-color-paper, #ffffff)` | behind a list |
| `--kz-natural-language-form-shadow` | `0 18px 40px -16px rgba(10, 10, 10, 0.3)` |  |

- Attributes: `data-error` (e.g. `Your name, so we know who to answer.`, `An email we can answer to.`), `data-failed`, `data-if` (e.g. `company`), `data-send`, `data-value` (e.g. `name`, `need`, `company`, `when`, `email`)
- Events: `kodza:submit`, bubbling from the root

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-natural-language-form {
    --kz-natural-language-form-fg: #f2f2f0;
    --kz-natural-language-form-muted: rgba(242, 242, 240, 0.62);
    --kz-natural-language-form-line: rgba(255, 255, 255, 0.2);
    --kz-natural-language-form-rule: rgba(255, 255, 255, 0.12);
    --kz-natural-language-form-soft: rgba(255, 255, 255, 0.07);
    --kz-natural-language-form-ink: #f2f2f0;
    --kz-natural-language-form-on-ink: #0a0a0a;
    --kz-natural-language-form-list: #161616;
    --kz-natural-language-form-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.7);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a word to pick, while its list is open | `ArrowDown` / `ArrowUp` | Next or previous option, no looping |
|  | `Home` / `End` | First or last option |
|  | a letter | Jumps to the option starting with that letter |
|  | `Enter` / `Space` | Picks the highlighted option and closes |
|  | `Tab` | Picks the highlighted option and moves on |
| On a word to pick | `Enter` / `Space` / `ArrowDown` / `ArrowUp` | Opens its list on the current choice |
|  | a letter | Picks the option starting with that letter, no opening |
| In a blank | `Enter` | Sends it, or shows what is missing |
| Anywhere, while a list is open | `Escape` | Closes it, focus back on the word |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
