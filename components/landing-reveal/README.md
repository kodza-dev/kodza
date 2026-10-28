# Landing Reveal

[![Landing Reveal, live on kodza.dev](https://kodza.dev/anim/landing-reveal/og.jpg)](https://kodza.dev/components/landing-reveal/)

A preloader that counts the files your hero really needs while its images rise onto a pile. At 100 the hero image comes up last and grows into place, then the title rises. Click or any key skips. No GSAP.

**[Live demo](https://kodza.dev/components/landing-reveal/)** · Preloaders & transitions · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-landing-reveal.html`](kodza-landing-reveal.html) | 3.0 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-landing-reveal.css`](kodza-landing-reveal.css) | 31.6 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-landing-reveal.js`](kodza-landing-reveal.js) | 28.5 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-landing-reveal.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-landing-reveal.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

It takes the whole screen, or reacts to the page scroll: give it a page, not a small box.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/landing-reveal/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Add the Kodza Landing Reveal to my page.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-landing-reveal` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-landing-reveal-bg` | `#ffffff` | the loader's paper: your page colour, so the hand-over is seamless |
| `--kz-landing-reveal-fg` | `#0a0a0a` | the loader's counter and labels |
| `--kz-landing-reveal-muted` | `rgba(10, 10, 10, 0.62)` |  |
| `--kz-landing-reveal-line` | `rgba(10, 10, 10, 0.1)` |  |
| `--kz-landing-reveal-text` | `#f2f2f0` | the hero, over its image |
| `--kz-landing-reveal-text-muted` | `rgba(242, 242, 240, 0.74)` |  |
| `--kz-landing-reveal-veil` | `rgba(10, 10, 10, 0.6)` | under the text, so it reads on any image |
| `--kz-landing-reveal-button` | `#f2f2f0` |  |
| `--kz-landing-reveal-on-button` | `#0a0a0a` |  |
| `--kz-landing-reveal-card` | `clamp(148px, 26vmin, 260px)` | width of the pile |
| `--kz-landing-reveal-radius` | `0px` | the hero image: 0 = edge to edge |
| `--kz-landing-reveal-height` | `100svh` | the hero; take your header off if it sits above |
| `--kz-landing-reveal-side` | `24px` |  |
| `--kz-landing-reveal-min` | `2.2s` | 100 never comes sooner, even with every file cached |
| `--kz-landing-reveal-max` | `2.8s` | nor later: past it, the hero comes in without the late files |
| `--kz-landing-reveal-ease` | `cubic-bezier(0.65, 0, 0.35, 1)` | the hero image growing into place |

- Attributes: `data-caption` (e.g. `display: block`, `display: grid`, `z-index: 9999`, `float: left`, `border-radius`, `steps(5, end)`), `data-enter` (e.g. `down`), `data-once`

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-landing-reveal {
    --kz-landing-reveal-bg: #0a0a0a;
    --kz-landing-reveal-fg: #f2f2f0;
    --kz-landing-reveal-muted: rgba(242, 242, 240, 0.62);
    --kz-landing-reveal-line: rgba(242, 242, 240, 0.14);
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Keyboard

| Where | Keys | What happens |
| --- | --- | --- |
| Anywhere, while the intro plays | `Enter` / `Tab` | Skips the intro, like any other key |
|  | `Space` / `PageUp` / `PageDown` / `Home` / `End` / `ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight` | Skips it too, the page stays where it is |

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
