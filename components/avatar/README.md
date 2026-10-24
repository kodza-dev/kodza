# Avatar

[![Avatar, live on kodza.dev](https://kodza.dev/anim/avatar/og.jpg)](https://kodza.dev/components/avatar/)

Initials or a picture in four sizes, a status told by a shape (full, ring, bar, faded), and a group that spreads when you come near, the face you point at saying its name.

**[Live demo](https://kodza.dev/components/avatar/)** · Data display · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-avatar.html`](kodza-avatar.html) | 1.3 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-avatar.css`](kodza-avatar.css) | 6.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-avatar.js`](kodza-avatar.js) | 3.6 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-avatar.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-avatar.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/avatar/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Show my team with Kodza Avatars, grouped, with their status.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-avatar` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-avatar-size` | `40px` |  |
| `--kz-avatar-bg` | `#e6e6e3` |  |
| `--kz-avatar-fg` | `#0a0a0a` |  |
| `--kz-avatar-ring` | `#f2f2f0` |  |
| `--kz-avatar-ink` | `#0a0a0a` |  |
| `--kz-avatar-on-ink` | `#ffffff` |  |
| `--kz-avatar-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Modifiers: `.kodza-avatar--lg`, `.kodza-avatar--more`, `.kodza-avatar--sm`, `.kodza-avatar--square`, `.kodza-avatar--xl`
- Attributes: `data-name` (e.g. `Ada Lovelace`, `Linus Torvalds`, `Grace Hopper`, `Alan Turing`, `Margaret Hamilton`), `data-status` (e.g. `away`, `busy`, `offline`, `online`)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-avatar {
    --kz-avatar-bg: #2a2a2a;
    --kz-avatar-fg: #f2f2f0;
    --kz-avatar-ring: #0a0a0a;
    --kz-avatar-ink: #f2f2f0;
    --kz-avatar-on-ink: #0a0a0a;
  }

  .kodza-avatar-group .kodza-avatar:nth-child(3n) {
    background: #4a4a4a;
  }

  .kodza-avatar-group .kodza-avatar--more {
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 0 2px #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

## Images

The images are Kodza placeholders, served from kodza.dev. Swap them for your own before you ship.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
