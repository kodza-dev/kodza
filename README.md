<p align="center"><a href="https://kodza.dev"><img src="https://kodza.dev/og/kodza.jpg" alt="Kodza: UI components your AI can fetch" width="840"></a></p>

# Kodza

UI components your AI can fetch. Plain HTML, CSS and JavaScript: no framework, no build step, no dependencies.

**[kodza.dev](https://kodza.dev)** · [Catalogue](https://kodza.dev/components/) · [Docs](https://kodza.dev/docs/) · [Request a component](https://github.com/kodza-dev/requests/discussions)

## Just ask

Kodza is an MCP server too, at `https://kodza.dev/api/mcp` (Streamable HTTP). Free, no account, no API key. Plug it into your AI once:

```bash
claude mcp add -t http kodza https://kodza.dev/api/mcp
```

Then ask in your own words: "Add the Kodza fill button to my hero." It gets the exact files in this repository, not its best guess, and where they go.

### In your editor

**Codex**

```bash
codex mcp add kodza --url https://kodza.dev/api/mcp
```

**VS Code** (GitHub Copilot)

```bash
code --add-mcp '{"name":"kodza","type":"http","url":"https://kodza.dev/api/mcp"}'
```

**Cursor** (`~/.cursor/mcp.json`)

```json
{ "mcpServers": { "kodza": { "url": "https://kodza.dev/api/mcp" } } }
```

Rather keep it on your machine? `npx -y kodza-mcp` runs the same server locally ([kodza-mcp](https://www.npmjs.com/package/kodza-mcp)). Everything else in the [docs](https://kodza.dev/docs/#install).

### What it does

| Tool | What it does |
| --- | --- |
| `search_components` | Finds components by what they do or look like ("button fill hover", "sticky header", "date picker"), or lists a category. |
| `get_component` | One component: its exact HTML, CSS and JS (or the commands to download them), its settings (`--kz-…` variables, modifier classes, `data-` attributes), what each key does, its dark-mode values and how to wire it into a plain page, WordPress, Shopify, React or a Claude artifact. |

Read-only: it hands out code and never touches your project. It counts which components get fetched, and by which assistant; nothing you type is kept.

## Or take the files

Each folder in [`components/`](components/) is one component: the HTML, the CSS and, when it needs one, the JS. Link the CSS, paste the HTML, load the JS. It lands in a bare HTML page, WordPress, Shopify or React, because it's just code.

Written like it's going live tomorrow. Because it probably is.

- The CSS only touches `kodza-` classes. A generated theme guard keeps your site's CSS off the component.
- Settings are CSS variables (`--kz-…`), variants are modifier classes or `data-` attributes.
- As many instances as you like on one page, one copy of the JS for all of them.
- Keyboard, visible focus and `prefers-reduced-motion`, on every one.
- `kodza:init` and `kodza:destroy` for content loaded later: AJAX themes, Swup, React.

## The components

115 of them, and counting. Each name opens its folder, each demo runs on kodza.dev.

### Buttons

| Component | What it does | |
| --- | --- | --- |
| [3D Press Button](components/press-button/) | A button with real thickness: the face sinks into its base, even the quickest tap goes all the way down, and it springs back with a small bounce. A keycap, a brutalist slab, or a toggle that stays down. | [Demo](https://kodza.dev/components/press-button/) |
| [Arrow Button](components/button-arrow-slide/) | An arrow that draws itself in on hover, nudges the label aside, then carries on through the button when you leave. | [Demo](https://kodza.dev/components/button-arrow-slide/) |
| [Call Button](components/call-button-expand/) | A round phone icon that opens into a full "Book a call" button, with a little ring. Stays open on touch screens. Pure CSS. | [Demo](https://kodza.dev/components/call-button-expand/) |
| [Copy to Clipboard](components/copy-clipboard/) | A command, or a sentence for your AI, with a copy button: the icon turns into a check that draws itself and the label rolls to "Copied". | [Demo](https://kodza.dev/components/copy-clipboard/) |
| [Fill Button](components/button-fill/) | A button that fills from the exact point your cursor enters and empties toward where it leaves, with a rolling label and a looping arrow. | [Demo](https://kodza.dev/components/button-fill/) |
| [Hold to Confirm](components/hold-to-confirm/) | For the actions you cannot take back: hold it down and an ink pill fills the button, let go too early and it drains back, hold to the end and it ticks. Mouse, finger, Space or Enter. | [Demo](https://kodza.dev/components/hold-to-confirm/) |
| [Loading Button](components/loading-button/) | A button that shows its work: its words roll from Deploy to Deploying while a ring comes in, then the ring closes on a tick for Deployed. The width never moves. | [Demo](https://kodza.dev/components/loading-button/) |
| [Magnetic Button](components/magnetic-button/) | A button that leans towards the pointer as it comes near, its words a little further, and settles back softly. Its click area moves with it. Calm on touch screens. | [Demo](https://kodza.dev/components/magnetic-button/) |
| [Morph Button](components/button-svg-morph/) | A pill that tightens into a circle on hover while its label gives way to an arrow. The clickable area never moves. Pure CSS. | [Demo](https://kodza.dev/components/button-svg-morph/) |
| [Roll Button](components/button-slide/) | A button whose label rolls up letter by letter on hover, and keeps rolling the same way when you leave. Plain CSS and a few lines of JS. | [Demo](https://kodza.dev/components/button-slide/) |
| [Share Button](components/share-button/) | Press Share and the options slide out from behind it, the last one pushing the pill open, while the arrow takes off and a cross draws itself. Copy link turns into a check; X and LinkedIn open in a small window. | [Demo](https://kodza.dev/components/share-button/) |
| [Split Button](components/split-button/) | The main action on the left, the other options behind an arrow. One tint slides between the halves; pick another way to do it and the label rolls over, the button easing to its new width. | [Demo](https://kodza.dev/components/split-button/) |

### Links

| Component | What it does | |
| --- | --- | --- |
| [Arrow Link](components/arrow-link/) | A link that points the way: at rest a chevron, on hover the shaft draws itself in and the head moves on, › becomes →. A back variant points the other way. Pure CSS. | [Demo](https://kodza.dev/components/arrow-link/) |
| [External Link](components/external-link/) | A link that leaves the site says so: a line of ink runs under the words to the ↗, which then springs out towards the corner, its shaft stretching after it. Pure CSS. | [Demo](https://kodza.dev/components/external-link/) |
| [Highlight Link](components/hover-link-text-background-reveal/) | A highlighter stroke that sweeps behind the link text, or a solid block that flips the text to white exactly under its edge. | [Demo](https://kodza.dev/components/hover-link-text-background-reveal/) |
| [Link Preview](components/link-preview/) | Point at a link and a card of where it goes unfolds above it. One card per paragraph: it glides from link to link, its picture cross-fading and its words rolling. | [Demo](https://kodza.dev/components/link-preview/) |
| [Scramble Link](components/hover-link-text-shuffle/) | Hover a link and its word scrambles, then settles from left to right: symbols that decode, its own letters shuffling, or a split-flap. | [Demo](https://kodza.dev/components/hover-link-text-shuffle/) |
| [Underline Link](components/hover-link-text-underline/) | An underline that slides in from the left and leaves through the right, or the reverse. Follows the text across lines, like a pen. | [Demo](https://kodza.dev/components/hover-link-text-underline/) |

### Forms

| Component | What it does | |
| --- | --- | --- |
| [Checkbox](components/checkbox-component/) | Real checkboxes, redrawn: ink grows from the centre and the tick draws itself. A select-all box shows a dash when only some are checked. Cards too. | [Demo](https://kodza.dev/components/checkbox-component/) |
| [Color Picker](components/color-picker/) | A real colour input with a proper panel: saturation square, hue slider, hex field, presets, eyedropper and copy. Pick a preset and the handles glide to it. | [Demo](https://kodza.dev/components/color-picker/) |
| [Date Picker](components/date-picker/) | A real date input with a calendar: months slide the way you go, the month name rolls, and the ink mark travels to the day you pick. Full keyboard. | [Demo](https://kodza.dev/components/date-picker/) |
| [File Upload](components/file-upload/) | A drop zone over a real file input: the border marches when files hover, each file gets a row with a thumbnail and a rolling progress, too-big files say so. | [Demo](https://kodza.dev/components/file-upload/) |
| [Multi Select](components/multi-select/) | A real multiple select as a field of tags: type to filter, pick to add a tag. Removed tags shrink away while the others glide into their place. | [Demo](https://kodza.dev/components/multi-select/) |
| [OTP Input](components/otp-input/) | A one-time code field: one real input drawn as cells. Digits rise into place, paste and SMS autofill just work, and the cells turn to ink once complete. | [Demo](https://kodza.dev/components/otp-input/) |
| [Password](components/password-field/) | A password field with an eye that crosses itself out, a meter that fills as it gets stronger, a verdict that rolls and rules that tick themselves off. | [Demo](https://kodza.dev/components/password-field/) |
| [Radio](components/radio-component/) | Real radio buttons with one dot for the whole group: pick another option and the dot travels to it, stretching on the way like a drop of ink. | [Demo](https://kodza.dev/components/radio-component/) |
| [Range Slider](components/range-slider/) | Real range inputs on a drawn track: a value bubble pops out of the handle, ticks darken as the fill passes, and two handles push each other instead of crossing. | [Demo](https://kodza.dev/components/range-slider/) |
| [Search Autocomplete](components/search-input/) | A search field over a real datalist: suggestions unroll under it, grouped, with the letters you typed underlined. "/" jumps in, arrows and Enter drive. | [Demo](https://kodza.dev/components/search-input/) |
| [Select](components/custom-select/) | A real select, dressed up: the list unrolls from the field, a highlight slides between options and the value rolls to your choice. A pill for toolbars too. | [Demo](https://kodza.dev/components/custom-select/) |
| [Star Rating](components/rating-component/) | Real radio buttons drawn as stars: they light up one after the other under the pointer, the word rolls from Meh to Shipped it, and a static score fills in view. | [Demo](https://kodza.dev/components/rating-component/) |
| [Switch](components/switch-toggle/) | A real checkbox redrawn as a switch: the ink fills the track behind the thumb, the thumb stretches while pressed and springs into place. Labels, toolbars too. | [Demo](https://kodza.dev/components/switch-toggle/) |
| [Text Field](components/text-field/) | A text field whose label folds up as you type. A button clears it, a check draws itself once it is valid, and the hint gives way to the error. | [Demo](https://kodza.dev/components/text-field/) |
| [Textarea](components/textarea/) | A textarea whose label folds up, whose height eases to fit the text, and whose ring fills as you near the limit, with the characters left in the last fifth. | [Demo](https://kodza.dev/components/textarea/) |

### Navigation

| Component | What it does | |
| --- | --- | --- |
| [Breadcrumbs](components/breadcrumbs/) | A breadcrumb trail that folds its middle behind a "…" button when it would not fit on one line, and unfolds it crumb after crumb. | [Demo](https://kodza.dev/components/breadcrumbs/) |
| [Command Palette](components/command-palette/) | A ⌘K palette in a real dialog: results filter as you type, matched letters are underlined and a highlight slides between them. | [Demo](https://kodza.dev/components/command-palette/) |
| [Context Menu](components/context-menu/) | A right-click menu that grows from the exact point you clicked, stays on screen and works from the keyboard with Shift + F10. | [Demo](https://kodza.dev/components/context-menu/) |
| [Dropdown Menu](components/dropdown-menu/) | A menu that unrolls from its button, with a highlight that slides from item to item. Actions or choices, arrows and first letters. | [Demo](https://kodza.dev/components/dropdown-menu/) |
| [Hover Nav](components/hover-nav/) | A pill of links where the highlight slides under the pointer and settles back on the current page. The ink version turns the text white right at its edges. | [Demo](https://kodza.dev/components/hover-nav/) |
| [Pagination](components/pagination/) | Seven slots that never jump: the ink pill slides to the page and the numbers that change roll into place. Compact version included. | [Demo](https://kodza.dev/components/pagination/) |
| [Scroll Header](components/scroll-header/) | A floating glass pill that clears the top of the page, frosts as you scroll, steps aside while you read and turns to dark glass over dark sections. | [Demo](https://kodza.dev/components/scroll-header/) |
| [Sidebar Menu](components/sidebar-toggle-menu/) | A side panel that slides in over the page, then big links rise one by one. A real dialog: focus kept inside, Escape to leave. No GSAP. | [Demo](https://kodza.dev/components/sidebar-toggle-menu/) |
| [Staggered Horizontal Menu](components/menu-horizontal-stagger-reverse/) | A button that lets its links out one by one, nearest first, and calls them back in reverse. Its label rolls to "Close". No GSAP. | [Demo](https://kodza.dev/components/menu-horizontal-stagger-reverse/) |
| [Stepper](components/stepper/) | A flow in four steps: the line fills, a check draws itself on each finished step and the content slides in from where you are heading. | [Demo](https://kodza.dev/components/stepper/) |
| [Table of Contents](components/table-of-contents/) | A summary card built from your headings: an ink marker follows the section you read, a ring fills, the time left counts down. A bar on phones. | [Demo](https://kodza.dev/components/table-of-contents/) |
| [Tabs](components/tabs-component/) | Tabs with a pill (or a line) that slides to the chosen one, a panel that comes in from its side, and the full keyboard pattern. | [Demo](https://kodza.dev/components/tabs-component/) |
| [Trapdoor Menu](components/trapdoor-menu/) | Press Menu and the page swings down on its hinge like a trapdoor, showing the menu underneath: links rise as the edge passes them, an image follows your pointer. Closing replays it backwards. No GSAP. | [Demo](https://kodza.dev/components/trapdoor-menu/) |

### Overlays

| Component | What it does | |
| --- | --- | --- |
| [Cookie Consent](components/cookie-consent/) | An honest cookie card: Reject weighs as much as Accept, Choose unfolds the categories, the choice is kept and a link brings the card back. | [Demo](https://kodza.dev/components/cookie-consent/) |
| [Dialog](components/modal-component/) | A real dialog that grows out of the button that opened it and goes back into it. The alert version asks you to type the name before it deletes anything. | [Demo](https://kodza.dev/components/modal-component/) |
| [Popover](components/popover/) | A panel that grows out of its trigger, arrow pointing back at it, and flips when there is no room. On click, or on hover as a hover card that stays put. | [Demo](https://kodza.dev/components/popover/) |
| [Product Tour](components/product-tour/) | A guided tour: the page dims, a spotlight cuts out each element and glides to the next, reshaping on the way, with a card that follows. Keyboard too. | [Demo](https://kodza.dev/components/product-tour/) |
| [Sheet](components/drawer/) | A panel that slides in from the right, and on phones rises from the bottom as a sheet you drag, with half and full stops and a flick to dismiss. | [Demo](https://kodza.dev/components/drawer/) |
| [Toast](components/toast-notification/) | Notifications that stack like a deck and spread out on hover. Time runs out on a thin line, a swipe dismisses, and a loading toast turns into a success. | [Demo](https://kodza.dev/components/toast-notification/) |
| [Tooltip](components/tooltip-component/) | One bubble per group: it waits on the first hover, then glides from button to button, resizing to its words, with the keyboard shortcut inside. | [Demo](https://kodza.dev/components/tooltip-component/) |

### Feedback & loading

| Component | What it does | |
| --- | --- | --- |
| [Alert](components/alert/) | A message in the page: note, success, warning or error, told apart by the icon, not by color. The icon draws itself, a dismissed alert folds away and an error unfolds its log. | [Demo](https://kodza.dev/components/alert/) |
| [Empty State](components/empty-state/) | What a list shows when it is empty: a CSS drawing that answers when you come near, a line in a human voice and the next step. A second take for searches that find nothing. | [Demo](https://kodza.dev/components/empty-state/) |
| [Progress](components/progress-bar/) | A bar or a ring driven by data-value: the percentage rolls like an odometer, a segment slides while nobody knows, and at 100 a tick draws itself. | [Demo](https://kodza.dev/components/progress-bar/) |
| [Skeleton](components/skeleton-loader/) | Bones drawn from the content itself, one shine across them all. When it loads, a soft edge sweeps down and turns each bone into its line; late images keep theirs. | [Demo](https://kodza.dev/components/skeleton-loader/) |
| [Spinner](components/loading-spinner/) | A loading status sized on its text: a breathing ring, twelve bars, three dots or a terminal braille cell. Add .is-done and a tick draws itself while the words roll. | [Demo](https://kodza.dev/components/loading-spinner/) |
| [Top Loading Bar](components/top-loading-bar/) | The thin line at the top of the screen while a page loads: it creeps in shrinking steps, runs to the end and slips off to the right. Starts by itself on the site's links. | [Demo](https://kodza.dev/components/top-loading-bar/) |

### Data display

| Component | What it does | |
| --- | --- | --- |
| [Accordion](components/accordion-component/) | Questions that open on their answer, on a native <details>: the panel opens at its real height, the answer rises, the plus turns into a minus. One open at a time if you like. | [Demo](https://kodza.dev/components/accordion-component/) |
| [Avatar](components/avatar/) | Initials or a picture in four sizes, a status told by a shape (full, ring, bar, faded), and a group that spreads when you come near, the face you point at saying its name. | [Demo](https://kodza.dev/components/avatar/) |
| [Badge](components/badge/) | Small labels: soft, solid, live, mono and a count that rolls. Remove a tag and it shrinks away while its neighbours glide to their new place, across lines too. | [Demo](https://kodza.dev/components/badge/) |
| [Code Block](components/code-block/) | Code to read and copy: file name, line numbers, highlighted lines and a monochrome syntax in weight and light. Copy rolls to Copied; a terminal copies its commands only. | [Demo](https://kodza.dev/components/code-block/) |
| [Countdown](components/event-day-counter/) | A live countdown to a date: every digit that changes falls out of its window as the next one drops in, and at zero the figures step aside for your message. Large or inline. | [Demo](https://kodza.dev/components/event-day-counter/) |
| [Counter](components/counter-animation/) | A figure that rolls into place like an odometer when it comes into view: digits on the right spin more and land last, a zero takes a full turn. Readable without the script. | [Demo](https://kodza.dev/components/counter-animation/) |
| [Filter Transitions](components/filter-transitions/) | A filterable grid: the ink pill slides to the filter, leaving cards step back, the others glide to their new place and the new ones arrive in turn. | [Demo](https://kodza.dev/components/filter-transitions/) |
| [Kbd](components/kbd/) | Keyboard keys with a little depth, alone, in a combo or in a list of shortcuts. Type one for real and its keys sink as you press them; the whole combo down lights its line. | [Demo](https://kodza.dev/components/kbd/) |
| [Separator](components/separator/) | Lines that draw themselves from their middle when they come into view: a plain rule, one with a label or a section title, one around a CSS dot, and verticals between items. | [Demo](https://kodza.dev/components/separator/) |
| [Show More](components/collapsible/) | Long content kept short until asked: a text cut by a soft fade, or a list that says how many items are left. It opens at its real height and the button's words roll. | [Demo](https://kodza.dev/components/collapsible/) |
| [Stat Card](components/stat-card/) | A key figure, its change and the curve behind it: the figure rolls, the curve draws itself and a guide follows your pointer with the value of the day. Trends told by arrows. | [Demo](https://kodza.dev/components/stat-card/) |
| [Table](components/table/) | A data table that sorts when you click a column: rows glide to their new place, the sorted column gets a soft band, the header stays on top and the edges fade while it scrolls. | [Demo](https://kodza.dev/components/table/) |
| [Timeline](components/timeline-component/) | Dated steps along a rail that fills as you scroll: each dot fills when the ink reaches it, each step rises into place the first time it is seen, the last one reached stays marked. | [Demo](https://kodza.dev/components/timeline-component/) |

### Cards

| Component | What it does | |
| --- | --- | --- |
| [Border Trace Card](components/hover-gradient-card/) | On hover a single line draws the card border from the exact point where the pointer came in. One way, both ways, or just the corners. | [Demo](https://kodza.dev/components/hover-gradient-card/) |
| [Card](components/card/) | An editorial card, clickable as a whole through one link: the image drifts closer, the border firms up and an arrow slides in. | [Demo](https://kodza.dev/components/card/) |
| [Expandable Card](components/expandable-card/) | A row of cards where one is always open: click another and it widens while the others step back. Stacked on small screens. | [Demo](https://kodza.dev/components/expandable-card/) |
| [Pricing Plans](components/pricing-plans/) | Three plans in one block, the featured one inked and lifted out. Switch to yearly and only the digits that change roll to their new value. | [Demo](https://kodza.dev/components/pricing-plans/) |
| [Sticky Cards](components/sticky-cards/) | Cards that stack as you scroll, each covered card stepping back and darkening. Plain position: sticky and a few lines of JS. No GSAP. | [Demo](https://kodza.dev/components/sticky-cards/) |

### Media

| Component | What it does | |
| --- | --- | --- |
| [Before / After](components/before-after/) | Two pictures in one frame and a handle between them: drag it, click and it glides, or use the arrow keys. It nudges once when first seen; the labels step aside. | [Demo](https://kodza.dev/components/before-after/) |
| [Carousel](components/carousel/) | A native scroll-snap carousel that works before the script loads. Then: page buttons, a rolling count, a progress bar or dots, and mouse drag with a throw. Never steals the wheel. | [Demo](https://kodza.dev/components/carousel/) |
| [Fullscreen Slider](components/slider-horizontal-fullscreen/) | Full-bleed slides that change with a curtain while the title rises from a mask. Horizontal or vertical, buttons, arrow keys and swipe. No GSAP. | [Demo](https://kodza.dev/components/slider-horizontal-fullscreen/) |
| [Image Gallery](components/image-gallery/) | An editorial image grid: each image grows into a fullscreen viewer in one continuous motion, with curtain transitions between images and keyboard and swipe support. | [Demo](https://kodza.dev/components/image-gallery/) |
| [Lightbox](components/lightbox/) | Wrap an article and every picture in it opens large: it grows from its own place to the screen, arrows or a swipe go to the next, and it returns to its place on Escape. | [Demo](https://kodza.dev/components/lightbox/) |
| [Zoom Lens](components/zoom-lens/) | A closer look under the pointer: a round lens follows with a little lag and shows the detail from a sharper file, or the picture itself zooms towards the pointer. | [Demo](https://kodza.dev/components/zoom-lens/) |

### Text effects

| Component | What it does | |
| --- | --- | --- |
| [Annotated Text](components/text-highlight/) | Hand-drawn marks that draw themselves on key words when the paragraph shows up: underline, strike, circle or marker. | [Demo](https://kodza.dev/components/text-highlight/) |
| [Eye Glyph](components/eye-glyph/) | Any letter with a hole becomes an eye: the pupil follows the pointer, lashes grow on top, and real lids close it when it blinks. Poke one and it winks. | [Demo](https://kodza.dev/components/eye-glyph/) |
| [Marquee](components/scrolling-text-loop/) | An endless ticker that never jumps, eases to a stop under the pointer and fades at both edges. Runs either way. | [Demo](https://kodza.dev/components/scrolling-text-loop/) |
| [Scroll Text Reveal](components/animated-text-reveal/) | Words light up one after the other as a paragraph scrolls by, and dim again on the way back. Fade, blur or rise. No GSAP. | [Demo](https://kodza.dev/components/animated-text-reveal/) |
| [Shimmer Text](components/text-shimmer/) | A band of light that sweeps across text, the way a busy interface says "still working on it". Looping, on hover, or following the pointer. | [Demo](https://kodza.dev/components/text-shimmer/) |
| [Text Reveal](components/text-split-scroll-reveal/) | Text that writes itself in when it reaches the screen: lines rising from a mask, words coming into focus, or letters. Plays once. | [Demo](https://kodza.dev/components/text-split-scroll-reveal/) |
| [Typewriter](components/typewriter-effect/) | Phrases typed with a human rhythm and an honest caret. Retypes only what changes, or selects it like an editor before typing over it. | [Demo](https://kodza.dev/components/typewriter-effect/) |
| [Word Rotator](components/word-rotator/) | One word of a sentence keeps changing: the next one's letters rise as the old ones leave, or the word flips over. The space follows the word, the sentence moves along. | [Demo](https://kodza.dev/components/word-rotator/) |

### Image effects

| Component | What it does | |
| --- | --- | --- |
| [Hover List Preview](components/hover-list-preview/) | Point at a row and its picture shows in one frame that follows the pointer, wiping to the next picture as you move down the list. Panel mode, keyboard and touch thumbnails included. | [Demo](https://kodza.dev/components/hover-list-preview/) |
| [Image Hover](components/image-scale/) | Four ways for an image to answer the pointer, inside its own frame: a slow zoom, coming into focus, rounding off, or drifting with the cursor. | [Demo](https://kodza.dev/components/image-scale/) |
| [Image Reveal](components/image-reveal/) | A picture that unveils itself when it comes into view: a curtain opens from below, from the side or like an iris while the picture settles from a slight zoom. | [Demo](https://kodza.dev/components/image-reveal/) |

### Backgrounds & textures

| Component | What it does | |
| --- | --- | --- |
| [Grain](components/grain/) | Film grain from one inline SVG noise, jumping ten times a second like the next frame of a roll: under the words of a section, over its photo. The specks take your two colours. Nothing to download. | [Demo](https://kodza.dev/components/grain/) |
| [Interactive Dots](components/interactive-dots/) | A hero over a field of fine dots. The pointer pushes them aside like a hand in sand, they spring back, and a click sends a wave across. One canvas, asleep when nobody is looking. | [Demo](https://kodza.dev/components/interactive-dots/) |
| [Pattern Background](components/pattern-background/) | A hero framed by its own pattern: the grid lines up on your content, four hairlines run along its edges with crop marks on the corners, the rest fades out. Grid, dots, crosses or diagonals. No images. | [Demo](https://kodza.dev/components/pattern-background/) |

### Scroll

| Component | What it does | |
| --- | --- | --- |
| [Back to Top](components/back-to-top/) | A round button that shows up a screen down, its ring filling as you read. Its label unrolls on hover, the arrow takes off when you click. | [Demo](https://kodza.dev/components/back-to-top/) |
| [Horizontal Scroll](components/horizontal-scroll/) | A section that pins itself while its cards slide sideways as you scroll down. Pictures drift in their frames, the counter rolls. A swipe on touch. | [Demo](https://kodza.dev/components/horizontal-scroll/) |
| [Infinite Scroll](components/infinite-scroll/) | Placeholders the size of a post shimmer in, then turn into the posts without a jump. Two loads on their own, then a button, so the footer stays reachable. | [Demo](https://kodza.dev/components/infinite-scroll/) |
| [Scroll Reveal](components/fade-in-scroll/) | Blocks make their entrance as they scroll in: a fade, lines rising from a mask, or an image unveiled by clip-path. Blocks that arrive together take turns. | [Demo](https://kodza.dev/components/fade-in-scroll/) |
| [Sticky Scroll Reveal](components/sticky-scroll-reveal/) | A block that pins itself while big statements take turns as you scroll: each line leaves through its own mask while the next one rises. | [Demo](https://kodza.dev/components/sticky-scroll-reveal/) |
| [Sticky Steps](components/sticky-steps/) | A picture pinned on one side, steps scrolling on the other: each step draws its picture over the last like a curtain, and the counter rolls along. | [Demo](https://kodza.dev/components/sticky-steps/) |

### Cursor

| Component | What it does | |
| --- | --- | --- |
| [Custom Cursor](components/hover-custom-cursor/) | Inside its zone the pointer becomes a dot with a soft lag, and a pill that says what a click will do over each item. No GSAP. | [Demo](https://kodza.dev/components/hover-custom-cursor/) |

### Preloaders & transitions

| Component | What it does | |
| --- | --- | --- |
| [Landing Reveal](components/landing-reveal/) | A preloader that counts the files your hero really needs while its images rise onto a pile. At 100 the hero image comes up last and grows into place, then the title rises. Click or any key skips. No GSAP. | [Demo](https://kodza.dev/components/landing-reveal/) |
| [Page Lift](components/page-lift/) | Between two real pages, the one you leave recedes as the next rises over it on a rounded edge. The header stays, back plays it in reverse. Chrome, Edge, Safari; Firefox loads plainly for now. No GSAP. | [Demo](https://kodza.dev/components/page-lift/) |

### Hero

| Component | What it does | |
| --- | --- | --- |
| [Hero Centered](components/hero-centered/) | A centred hero with an announcement pill, a headline whose lines rise out of their masks, one sentence and two pill buttons. CSS only, the entrance plays on load. | [Demo](https://kodza.dev/components/hero-centered/) |
| [Hero Cover](components/hero-cover/) | A cover hero: a full-width picture under a monochrome veil with the title at the bottom left. The picture opens from the top edge and settles, the title lines rise. CSS only. | [Demo](https://kodza.dev/components/hero-cover/) |
| [Hero Exit](components/hero-exit/) | A centred title in two big lines. On scroll the scene holds, the lines part, a picture opens between them and tightens into a card, then the next section slides over it. | [Demo](https://kodza.dev/components/hero-exit/) |
| [Hero Expand](components/hero-expand/) | A big title with a small picture set between two words. On scroll the scene pins, the picture opens to full screen and pushes the words aside, then a caption and a button rise. Scroll back up: it rewinds. | [Demo](https://kodza.dev/components/hero-expand/) |
| [Hero Focus](components/hero-focus/) | A title sharp over a blurred picture. On scroll the focus moves to the picture, the title blurs and leaves, a readout counts the distance, then notes point out the details. It rewinds. | [Demo](https://kodza.dev/components/hero-focus/) |
| [Hero Screen](components/hero-screen/) | A centred title and its buttons over a screenshot of the product, leaning back in perspective. On scroll the screen stands up to face you and grows while the title steps back. | [Demo](https://kodza.dev/components/hero-screen/) |
| [Hero Showcase](components/hero-showcase/) | A title over a wall of project thumbnails laid back like prints on a table. On scroll the rows slide in opposite directions and click into line as the wall stands up, every thumbnail a link. | [Demo](https://kodza.dev/components/hero-showcase/) |
| [Hero Split](components/hero-split/) | A split hero, words on the left and a 4:5 picture on the right: the title lines rise out of their masks while the picture opens from the top edge down. | [Demo](https://kodza.dev/components/hero-split/) |
| [Hero Statement](components/hero-statement/) | A studio statement set very large over a mono line with the city, a live local time and the booking window. The words rise out of their masks one after the other on load. | [Demo](https://kodza.dev/components/hero-statement/) |

## About this repository

It mirrors [kodza.dev](https://kodza.dev): when a component ships or changes there, it lands here. Every file is generated, none is edited by hand, so pull requests are not merged.

Found a bug, or missing a component? [kodza-dev/requests](https://github.com/kodza-dev/requests): issues for bugs, discussions for requests, with votes.

## License

The [Kodza License](LICENSE). Use the components in any project, personal or commercial, client work included, no attribution needed. Don't resell or redistribute them, and don't offer them through another catalogue, registry or MCP server.

Use it anywhere. Don't resell it.
