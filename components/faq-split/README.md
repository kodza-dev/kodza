# FAQ Split

[![FAQ Split, live on kodza.dev](https://kodza.dev/anim/faq-split/og.jpg)](https://kodza.dev/components/faq-split/)

A two-column FAQ section: title, topics and a way out pinned on the left, questions by topic on the right, and FAQPage structured data from the page.

**[Live demo](https://kodza.dev/components/faq-split/)** · FAQ · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-faq-split.html`](kodza-faq-split.html) | 6.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-faq-split.css`](kodza-faq-split.css) | 30.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-faq-split.js`](kodza-faq-split.js) | 16.1 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-faq-split.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-faq-split.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/faq-split/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza FAQ Split to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `[data-kodza-faq-split]` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-faq-split-ink` | `var(--kz-color-ink, #0a0a0a)` |  |
| `--kz-faq-split-muted` | `color-mix(in srgb, var(--kz-faq-split-ink) 62%, transparent)` | intro, answers, numbers |
| `--kz-faq-split-line` | `color-mix(in srgb, var(--kz-faq-split-ink) 12%, transparent)` | hairlines |
| `--kz-faq-split-soft` | `color-mix(in srgb, var(--kz-faq-split-ink) 6%, transparent)` | hover backgrounds |
| `--kz-faq-split-pill` | `var(--kz-color-accent, var(--kz-faq-split-ink))` | the pill of the topic being read |
| `--kz-faq-split-on-pill` | `var(--kz-color-on-accent, var(--kz-color-paper, #ffffff))` | its text |
| `--kz-faq-split-width` | `var(--kz-page-width, 1440px)` | the content column: the page's, set by the site |
| `--kz-faq-split-gutter` | `var(--kz-page-gutter, clamp(16px, 4vw, 40px))` | the space kept at the screen edges |
| `--kz-faq-split-space` | `clamp(56px, 7vw, 112px)` | above and below the section |
| `--kz-faq-split-gap` | `clamp(40px, 6vw, 112px)` | between the two columns |
| `--kz-faq-split-top` | `0px` | height of a fixed header: the left column pins under it |
| `--kz-faq-split-media-height` | `240px` | the picture of --media |
| `--kz-faq-split-mono` | `var(--kz-font-mono, "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace)` |  |
| `--kz-faq-split-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-faq-split--media`
- Attributes: `data-kodza-faq-split`, `data-nav-label`, `data-schema`, `data-single`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-faq-split {
    --kz-faq-split-ink: #f2f2f0;
    --kz-faq-split-muted: rgba(242, 242, 240, 0.62);
    --kz-faq-split-line: rgba(255, 255, 255, 0.14);
    --kz-faq-split-soft: rgba(255, 255, 255, 0.08);
    --kz-faq-split-pill: #f2f2f0;
    --kz-faq-split-on-pill: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| On a question | `Enter` / `Space` | Opens or closes the answer |
| On a topic | `Enter` | Jumps to the group and moves the focus to its title |

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
