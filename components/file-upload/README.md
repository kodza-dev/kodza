# File Upload

[![File Upload, live on kodza.dev](https://kodza.dev/anim/file-upload/og.jpg)](https://kodza.dev/components/file-upload/)

A drop zone over a real file input: the border marches when files hover, each file gets a row with a thumbnail and a rolling progress, too-big files say so.

**[Live demo](https://kodza.dev/components/file-upload/)** · Forms · HTML, CSS, JS · No dependencies

## Files

| File | Size | What it is |
| --- | ---: | --- |
| [`kodza-file-upload.html`](kodza-file-upload.html) | 0.8 KB | The markup. Adapt the text and links, paste it where the component goes, as many times as you need. |
| [`kodza-file-upload.css`](kodza-file-upload.css) | 14.9 KB | The styles. It only touches `kodza-` classes. The lines at the end with `:not(#_)` are the theme guard: they keep your site's CSS off the component. Keep them. |
| [`kodza-file-upload.js`](kodza-file-upload.js) | 11.3 KB | The script. One copy per page runs every instance. |

Byte for byte what the Copy button on kodza.dev gives you.

## Use it

1. Link the CSS in `<head>`: `<link rel="stylesheet" href="kodza-file-upload.css">`
2. Paste the HTML where the component goes.
3. Load the JS once, in `<head>`: `<script src="kodza-file-upload.js" defer></script>`

Content added after the page has loaded (an AJAX page, a modal, a React view): `document.dispatchEvent(new CustomEvent('kodza:init', { detail: { root } }))` starts the components inside `root`, `kodza:destroy` stops them and puts their markup back.

WordPress, Shopify, React: the steps are in the [docs](https://kodza.dev/docs/#wordpress), and on the [component page](https://kodza.dev/components/file-upload/).

## Or ask your AI

Plug Kodza in once (Claude Code here; Codex, Cursor and VS Code in the [docs](https://kodza.dev/docs/#install)):

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then say it in your own words, for example:

> Use Kodza File Upload for the attachments in my contact form.

Your AI gets these exact files, not its best guess, and where they go.

## Settings

CSS variables, set on `.kodza-upload` itself:

| Variable | Default | |
| --- | --- | --- |
| `--kz-upload-bg` | `#ffffff` |  |
| `--kz-upload-fg` | `#0a0a0a` |  |
| `--kz-upload-muted` | `rgba(10, 10, 10, 0.6)` |  |
| `--kz-upload-line` | `rgba(10, 10, 10, 0.24)` |  |
| `--kz-upload-soft` | `rgba(10, 10, 10, 0.05)` |  |
| `--kz-upload-ink` | `#0a0a0a` |  |
| `--kz-upload-on-ink` | `#ffffff` |  |
| `--kz-upload-radius` | `16px` |  |
| `--kz-upload-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |

- Attributes: `data-max-mb` (e.g. `10`)
- Events: `kodza:files`, bubbling from the root
- On the root element: `root.kodzaUpload`, `root.kodzaAdd` (see the comment at the top of the JS)

## Dark mode

The values Kodza uses on a dark background, after the component's CSS:

```css
@media (prefers-color-scheme: dark) {
  .kodza-upload {
    --kz-upload-bg: #161616;
    --kz-upload-fg: #f2f2f0;
    --kz-upload-muted: rgba(242, 242, 240, 0.62);
    --kz-upload-line: rgba(255, 255, 255, 0.26);
    --kz-upload-soft: rgba(255, 255, 255, 0.07);
    --kz-upload-ink: #f2f2f0;
    --kz-upload-on-ink: #0a0a0a;
  }
}
```

A site with its own theme switch puts the same rules under its dark selector instead.

---

Part of [Kodza](../../README.md). [Kodza License](../../LICENSE): use it anywhere, client work included. Don't resell it.
