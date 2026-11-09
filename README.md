<p align="center"><a href="https://kodza.dev"><img src="https://kodza.dev/og/kodza.jpg" alt="Kodza: UI components your AI can fetch" width="840"></a></p>

# Kodza

UI components your AI can fetch. Plain HTML, CSS and JavaScript: no framework, no build step, no dependencies.

**[kodza.dev](https://kodza.dev)** · [Catalogue](https://kodza.dev/components/) · [Docs](https://kodza.dev/docs/)

Found a bug, or missing a component? [kodza-dev/requests](https://github.com/kodza-dev/requests): issues for bugs, discussions for requests, with votes.

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
| `search_components` | Finds components by what they do or look like ("button fill hover", "sticky header", "date picker"), or lists a category, each with the link to its demo. |
| `get_component` | One component: its exact HTML, CSS and JS (or the commands to download them), its settings (`--kz-…` variables, modifier classes, `data-` attributes), what each key does, its dark-mode values and how to wire it into a plain page, WordPress, Shopify, React or a Claude artifact. |

Three slash commands too, for when you'd rather not write the request: `build_page`, `replace_element` and `find_component` (Claude Code: `/mcp__kodza__build_page`, VS Code: `/mcp.kodza.build_page`).

Read-only: it hands out code and never touches your project. It counts which components get fetched, and by which assistant; nothing you type is kept.

## Six of them

Picked from the 226. Each picture runs its demo on kodza.dev, each name opens its files.

<p>
<a href="https://kodza.dev/components/trapdoor-menu/"><img src="https://kodza.dev/anim/trapdoor-menu/og.jpg" alt="Trapdoor Menu" width="32%"></a>
<a href="https://kodza.dev/components/hero-showcase/"><img src="https://kodza.dev/anim/hero-showcase/og.jpg" alt="Hero Showcase" width="32%"></a>
<a href="https://kodza.dev/components/topographic-lines/"><img src="https://kodza.dev/anim/topographic-lines/og.jpg" alt="Topographic Lines" width="32%"></a>
<a href="https://kodza.dev/components/button-fill/"><img src="https://kodza.dev/anim/button-fill/og.jpg" alt="Fill Button" width="32%"></a>
<a href="https://kodza.dev/components/date-picker/"><img src="https://kodza.dev/anim/date-picker/og.jpg" alt="Date Picker" width="32%"></a>
<a href="https://kodza.dev/components/hover-list-preview/"><img src="https://kodza.dev/anim/hover-list-preview/og.jpg" alt="Hover List Preview" width="32%"></a>
</p>

[Trapdoor Menu](components/trapdoor-menu/) · [Hero Showcase](components/hero-showcase/) · [Topographic Lines](components/topographic-lines/) · [Fill Button](components/button-fill/) · [Date Picker](components/date-picker/) · [Hover List Preview](components/hover-list-preview/)

## Or take the files

Each folder in [`components/`](components/) is one component: the HTML, the CSS and, when it needs one, the JS. Link the CSS, paste the HTML, load the JS. It lands in a bare HTML page, WordPress, Shopify or React, because it's just code.

Written like it's going live tomorrow. Because it probably is.

- The CSS only touches `kodza-` classes. A generated theme guard keeps your site's CSS off the component.
- Settings are CSS variables (`--kz-…`), variants are modifier classes or `data-` attributes.
- As many instances as you like on one page, one copy of the JS for all of them.
- Keyboard, visible focus and `prefers-reduced-motion`, on every one.
- `kodza:init` and `kodza:destroy` for content loaded later: AJAX themes, Swup, React.

## The components

226 of them, and counting. Open a category: each name opens its folder, each demo runs on kodza.dev. All of them in motion: the [catalogue](https://kodza.dev/components/).

<details>
<summary><b>Buttons</b> · 15</summary>

| Component | What it does | |
| --- | --- | --- |
| [3D Press Button](components/press-button/) | A button with real thickness: the face sinks into its base, even the quickest tap goes all the way down, and it springs back with a small bounce. A keycap, a brutalist slab, or a toggle that stays down. | [Demo](https://kodza.dev/components/press-button/) |
| [Add to Cart](components/add-to-cart/) | Add-to-cart button that confirms with a tick while a copy of the product picture flies into the cart icon and its count rolls up by one. Rolls back if the request fails. | [Demo](https://kodza.dev/components/add-to-cart/) |
| [Arrow Button](components/button-arrow-slide/) | An arrow that draws itself in on hover, nudges the label aside, then carries on through the button when you leave. | [Demo](https://kodza.dev/components/button-arrow-slide/) |
| [Call Button](components/call-button-expand/) | A round phone icon that opens into a full "Book a call" button, with a little ring. Stays open on touch screens. Pure CSS. | [Demo](https://kodza.dev/components/call-button-expand/) |
| [Copy to Clipboard](components/copy-clipboard/) | A command, or a sentence for your AI, with a copy button: the icon turns into a check that draws itself and the label rolls to "Copied". | [Demo](https://kodza.dev/components/copy-clipboard/) |
| [Fill Button](components/button-fill/) | A button that fills from the exact point your cursor enters and empties toward where it leaves, with a rolling label and a looping arrow. | [Demo](https://kodza.dev/components/button-fill/) |
| [Hold to Confirm](components/hold-to-confirm/) | For the actions you cannot take back: hold it down and an ink pill fills the button, let go too early and it drains back, hold to the end and it ticks. Mouse, finger, Space or Enter. | [Demo](https://kodza.dev/components/hold-to-confirm/) |
| [Ink Like](components/ink-like/) | Like button whose heart fills with ink, a small wave riding the surface, and drains when the like is taken back. The count rolls digit by digit with carries (999 → 1,000) and rolls back if the request fails. | [Demo](https://kodza.dev/components/ink-like/) |
| [Loading Button](components/loading-button/) | A button that shows its work: its words roll from Deploy to Deploying while a ring comes in, then the ring closes on a tick for Deployed. The width never moves. | [Demo](https://kodza.dev/components/loading-button/) |
| [Magnetic Button](components/magnetic-button/) | A button that leans towards the pointer as it comes near, its words a little further, and settles back softly. Its click area moves with it. Calm on touch screens. | [Demo](https://kodza.dev/components/magnetic-button/) |
| [Morph Button](components/button-svg-morph/) | A pill that tightens into a circle on hover while its label gives way to an arrow. The clickable area never moves. Pure CSS. | [Demo](https://kodza.dev/components/button-svg-morph/) |
| [Roll Button](components/button-slide/) | A button whose label rolls up letter by letter on hover, and keeps rolling the same way when you leave. Plain CSS and a few lines of JS. | [Demo](https://kodza.dev/components/button-slide/) |
| [Scroll Down](components/scroll-down/) | The cue at the bottom of a hero: an arrow in a ring or a mouse whose wheel rolls now and then. One click glides to the next section, the first scroll fades it out, and it comes back at the top. | [Demo](https://kodza.dev/components/scroll-down/) |
| [Share Button](components/share-button/) | Press Share and the options slide out from behind it, the last one pushing the pill open, while the arrow takes off and a cross draws itself. Copy link turns into a check; X and LinkedIn open in a small window. | [Demo](https://kodza.dev/components/share-button/) |
| [Split Button](components/split-button/) | The main action on the left, the other options behind an arrow. One tint slides between the halves; pick another way to do it and the label rolls over, the button easing to its new width. | [Demo](https://kodza.dev/components/split-button/) |

</details>

<details>
<summary><b>Links</b> · 10</summary>

| Component | What it does | |
| --- | --- | --- |
| [Arrow Link](components/arrow-link/) | A link that points the way: at rest a chevron, on hover the shaft draws itself in and the head moves on, › becomes →. A back variant points the other way. Pure CSS. | [Demo](https://kodza.dev/components/arrow-link/) |
| [Download Link](components/download-link/) | A download link that shows the file's type and weight beside its words, read from the file itself. On hover the arrow sinks into its tray; a click sends it through and back from the top. | [Demo](https://kodza.dev/components/download-link/) |
| [External Link](components/external-link/) | A link that leaves the site says so: a line of ink runs under the words to the ↗, which then springs out towards the corner, its shaft stretching after it. Pure CSS. | [Demo](https://kodza.dev/components/external-link/) |
| [Footnote Link](components/footnote-link/) | Footnotes that stay on their line. Wide, the note sits in the margin level with its line and inks with its number; narrow, it folds out under the line. Picks up WordPress footnotes as they are. | [Demo](https://kodza.dev/components/footnote-link/) |
| [Heading Anchor](components/heading-anchor/) | A # beside every heading. It slides out of the margin when the heading is pointed at, or waits after the last word on a touch screen. Click it, or the heading, to put the section in the bar and copy the link. | [Demo](https://kodza.dev/components/heading-anchor/) |
| [Highlight Link](components/hover-link-text-background-reveal/) | A highlighter stroke that sweeps behind the link text, or a solid block that flips the text to white exactly under its edge. | [Demo](https://kodza.dev/components/hover-link-text-background-reveal/) |
| [Link Preview](components/link-preview/) | Point at a link and a card of where it goes unfolds above it. One card per paragraph: it glides from link to link, its picture cross-fading and its words rolling. | [Demo](https://kodza.dev/components/link-preview/) |
| [Quote Link](components/quote-link/) | Select words in an article and a pill offers a link to them: the page's address with a text fragment, which opens it scrolled to the quote and highlighted. It rolls to Link copied with a check. | [Demo](https://kodza.dev/components/quote-link/) |
| [Scramble Link](components/hover-link-text-shuffle/) | Hover a link and its word scrambles, then settles from left to right: symbols that decode, its own letters shuffling, or a split-flap. | [Demo](https://kodza.dev/components/hover-link-text-shuffle/) |
| [Underline Link](components/hover-link-text-underline/) | An underline that slides in from the left and leaves through the right, or the reverse. Follows the text across lines, like a pen. | [Demo](https://kodza.dev/components/hover-link-text-underline/) |

</details>

<details>
<summary><b>Forms</b> · 30</summary>

| Component | What it does | |
| --- | --- | --- |
| [Checkbox](components/checkbox-component/) | Real checkboxes, redrawn: ink grows from the centre and the tick draws itself. A select-all box shows a dash when only some are checked. Cards too. | [Demo](https://kodza.dev/components/checkbox-component/) |
| [Choice Cards](components/choice-cards/) | Cards to compare and pick, on real radio buttons or checkboxes, with a title, a line and an optional price. The picked card's ink border draws itself around it from the corner while a check draws in its mark. Pure CSS. | [Demo](https://kodza.dev/components/choice-cards/) |
| [Color Picker](components/color-picker/) | A real colour input with a proper panel: saturation square, hue slider, hex field, presets, eyedropper and copy. Pick a preset and the handles glide to it. | [Demo](https://kodza.dev/components/color-picker/) |
| [Combobox](components/combobox/) | A real select you can type into: the list filters as you type, accents and case aside, the matched letters underlined and the best match lit for Enter. Codes on the right are searched too. | [Demo](https://kodza.dev/components/combobox/) |
| [Date Picker](components/date-picker/) | A real date input with a calendar: months slide the way you go, the month name rolls, and the ink mark travels to the day you pick. Full keyboard. | [Demo](https://kodza.dev/components/date-picker/) |
| [Date Range](components/date-range/) | Two real date inputs behind one field and a two-month calendar: the ink band follows the pointer from the start to the end, the length counted as it goes, with optional shortcuts. Full keyboard. | [Demo](https://kodza.dev/components/date-range/) |
| [File Upload](components/file-upload/) | A drop zone over a real file input: the border marches when files hover, each file gets a row with a thumbnail and a rolling progress, too-big files say so. | [Demo](https://kodza.dev/components/file-upload/) |
| [Form Wizard](components/form-wizard/) | One real form cut into steps: Next checks the step first, the steps slide while the height eases, and the last one reads the answers back, each with its Edit. Sends via kodza:submit or a fetch. | [Demo](https://kodza.dev/components/form-wizard/) |
| [Inline Edit](components/inline-edit/) | Text that becomes its own field when clicked: the caret lands under the pointer, Enter saves with a check, Escape rolls the old text back in. A real input or textarea underneath, with a kodza:save event. | [Demo](https://kodza.dev/components/inline-edit/) |
| [Multi Select](components/multi-select/) | A real multiple select as a field of tags: type to filter, pick to add a tag. Removed tags shrink away while the others glide into their place. | [Demo](https://kodza.dev/components/multi-select/) |
| [Number Stepper](components/number-stepper/) | A real number input between − and +. Changed digits roll with the count, a held button speeds up, the edge button dims at the limit. Typed values are put back in range on leaving. | [Demo](https://kodza.dev/components/number-stepper/) |
| [OTP Input](components/otp-input/) | A one-time code field: one real input drawn as cells. Digits rise into place, paste and SMS autofill just work, and the cells turn to ink once complete. | [Demo](https://kodza.dev/components/otp-input/) |
| [Password](components/password-field/) | A password field with an eye that crosses itself out, a meter that fills as it gets stronger, a verdict that rolls and rules that tick themselves off. | [Demo](https://kodza.dev/components/password-field/) |
| [Phone Input](components/phone-input/) | A real tel input with its country code in front and a searchable list of countries: the number groups itself as it is typed, a pasted or typed +44 picks the country, and the form gets the number in E.164. | [Demo](https://kodza.dev/components/phone-input/) |
| [Radio](components/radio-component/) | Real radio buttons with one dot for the whole group: pick another option and the dot travels to it, stretching on the way like a drop of ink. | [Demo](https://kodza.dev/components/radio-component/) |
| [Range Slider](components/range-slider/) | Real range inputs on a drawn track: a value bubble pops out of the handle, ticks darken as the fill passes, and two handles push each other instead of crossing. | [Demo](https://kodza.dev/components/range-slider/) |
| [Rating Scale](components/rating-scale/) | A score on real radio buttons, from 0 to 10 or 1 to 5. The picked score fills with ink from the bottom, its end lights up, and an optional follow-up question unfolds and rolls to match the score. Pure CSS. | [Demo](https://kodza.dev/components/rating-scale/) |
| [Search Autocomplete](components/search-input/) | A search field over a real datalist: suggestions unroll under it, grouped, with the letters you typed underlined. "/" jumps in, arrows and Enter drive. | [Demo](https://kodza.dev/components/search-input/) |
| [Segmented Control](components/segmented-control/) | Two to five exclusive choices on real radio buttons. An ink pill slides to the one you pick, stretching on the way, and the labels turn white exactly at its edges. | [Demo](https://kodza.dev/components/segmented-control/) |
| [Select](components/custom-select/) | A real select, dressed up: the list unrolls from the field, a highlight slides between options and the value rolls to your choice. A pill for toolbars too. | [Demo](https://kodza.dev/components/custom-select/) |
| [Signature Pad](components/signature-pad/) | A box to sign with a finger, a mouse or a stylus: the ink thins as the pen speeds up, Undo backs the last stroke out along its path, and a typed name signs too. The form gets a trimmed PNG. | [Demo](https://kodza.dev/components/signature-pad/) |
| [Star Rating](components/rating-component/) | Real radio buttons drawn as stars: they light up one after the other under the pointer, the word rolls from Meh to Shipped it, and a static score fills in view. | [Demo](https://kodza.dev/components/rating-component/) |
| [Subscribe Field](components/subscribe-field/) | An email field and its button in one pill: the address is checked in place, the button rolls to a turning ring, then the thanks rises where the pill was. Posts to the form action or to your code. | [Demo](https://kodza.dev/components/subscribe-field/) |
| [Switch](components/switch-toggle/) | A real checkbox redrawn as a switch: the ink fills the track behind the thumb, the thumb stretches while pressed and springs into place. Labels, toolbars too. | [Demo](https://kodza.dev/components/switch-toggle/) |
| [Tags Input](components/tags-input/) | Free values as tags over a real text input, sent joined by commas. Enter or a comma makes a tag, a pasted list is split, a duplicate shakes its twin. Caps with data-max, checks emails. | [Demo](https://kodza.dev/components/tags-input/) |
| [Text Field](components/text-field/) | A text field whose label folds up as you type. A button clears it, a check draws itself once it is valid, and the hint gives way to the error. | [Demo](https://kodza.dev/components/text-field/) |
| [Textarea](components/textarea/) | A textarea whose label folds up, whose height eases to fit the text, and whose ring fills from the first character as you near the limit, with the characters left in the last fifth. | [Demo](https://kodza.dev/components/textarea/) |
| [Time Picker](components/time-picker/) | A time field over the real input: a wheel that snaps and takes the time once it stops, or the free slots of a day. | [Demo](https://kodza.dev/components/time-picker/) |
| [Toggle Group](components/toggle-group/) | Several on/off choices on real checkboxes. A picked option fills with ink from its centre and its plus turns into a check; picked days side by side join into one band. Pure CSS. | [Demo](https://kodza.dev/components/toggle-group/) |
| [Was This Helpful](components/was-this-helpful/) | A question and two thumbs: the chosen one fills with ink, No unfolds an optional note, then the thanks rolls in where the question was. Posts to the form action or to your code. | [Demo](https://kodza.dev/components/was-this-helpful/) |

</details>

<details>
<summary><b>Navigation</b> · 21</summary>

| Component | What it does | |
| --- | --- | --- |
| [A–Z Index](components/a-z-index/) | A bar of letters over a grouped list: a click glides to the group, an ink pill follows the letter you read, empty letters stay dimmed. Sticks to the top. | [Demo](https://kodza.dev/components/a-z-index/) |
| [Breadcrumbs](components/breadcrumbs/) | A breadcrumb trail that folds its middle behind a "…" button when it would not fit on one line, and unfolds it crumb after crumb. | [Demo](https://kodza.dev/components/breadcrumbs/) |
| [Burger Button](components/burger-button/) | A menu button: the lines meet, then cross, and Menu rolls to Close at a fixed width. It follows aria-expanded and fires kodza:burger, so it drives the menu you already have. | [Demo](https://kodza.dev/components/burger-button/) |
| [Command Palette](components/command-palette/) | A ⌘K palette in a real dialog: results filter as you type, matched letters are underlined and a highlight slides between them. | [Demo](https://kodza.dev/components/command-palette/) |
| [Context Menu](components/context-menu/) | A right-click menu that grows from the exact point you clicked, stays on screen and works from the keyboard with Shift + F10. | [Demo](https://kodza.dev/components/context-menu/) |
| [Dropdown Menu](components/dropdown-menu/) | A menu that unrolls from its button, with a highlight that slides from item to item. Actions or choices, arrows and first letters. | [Demo](https://kodza.dev/components/dropdown-menu/) |
| [Expanding Pill Menu](components/expanding-pill-menu/) | A Menu button that grows into the menu around itself: the card widens, then unfolds, Close stays on the button, and each link rises as the edge uncovers it. Grows upward near the bottom. | [Demo](https://kodza.dev/components/expanding-pill-menu/) |
| [Fullscreen Menu](components/fullscreen-menu/) | A fullscreen menu: a curtain comes down with its edge bending as it moves, the page backs off under it, and each link rises as the edge passes. Closing plays it backwards. | [Demo](https://kodza.dev/components/fullscreen-menu/) |
| [Hover Nav](components/hover-nav/) | A pill of links where the highlight slides under the pointer and settles back on the current page. The ink version turns the text white right at its edges. | [Demo](https://kodza.dev/components/hover-nav/) |
| [Multi-Level Menu](components/multi-level-menu/) | A burger drawer for menus with levels: each sub-menu slides in over the last, the top row rolls to the level's name and leads back, and it reads the list wp_nav_menu() writes. | [Demo](https://kodza.dev/components/multi-level-menu/) |
| [Pagination](components/pagination/) | Seven slots that never jump: the ink pill slides to the page and the numbers that change roll into place. Compact version included. | [Demo](https://kodza.dev/components/pagination/) |
| [Scroll Header](components/scroll-header/) | A floating glass pill that clears the top of the page, frosts as you scroll, steps aside while you read and turns to dark glass over dark sections. | [Demo](https://kodza.dev/components/scroll-header/) |
| [Shutter Menu](components/shutter-menu/) | A menu that comes down under your header like a shutter: each link rises as the edge reaches it, Menu rolls to Close. The panel is a native popover, so Escape, a click outside and focus return come free. | [Demo](https://kodza.dev/components/shutter-menu/) |
| [Side Reveal Menu](components/side-reveal-menu/) | A menu under the page: the page slides left and shrinks into a card, the menu was underneath, and each link rises as the page's edge passes. A click on the card closes it. | [Demo](https://kodza.dev/components/side-reveal-menu/) |
| [Sidebar Menu](components/sidebar-toggle-menu/) | A side panel that slides in over the page, then big links rise one by one. A real dialog: focus kept inside, Escape to leave. No GSAP. | [Demo](https://kodza.dev/components/sidebar-toggle-menu/) |
| [Staggered Horizontal Menu](components/menu-horizontal-stagger-reverse/) | A button that lets its links out one by one, nearest first, and calls them back in reverse. Its label rolls to "Close". No GSAP. | [Demo](https://kodza.dev/components/menu-horizontal-stagger-reverse/) |
| [Stepper](components/stepper/) | A flow in four steps: the line fills, a check draws itself on each finished step and the content slides in from where you are heading. | [Demo](https://kodza.dev/components/stepper/) |
| [Table of Contents](components/table-of-contents/) | A summary card built from your headings: an ink marker follows the section you read, a ring fills, the time left counts down. A bar on phones. | [Demo](https://kodza.dev/components/table-of-contents/) |
| [Tabs](components/tabs-component/) | Tabs with a pill (or a line) that slides to the chosen one, a panel that comes in from its side, and the full keyboard pattern. | [Demo](https://kodza.dev/components/tabs-component/) |
| [Theme Toggle](components/theme-toggle/) | A button that switches the page between light and dark, sun to moon. It starts from the system, keeps the visitor's choice, and swaps images that have a night version. | [Demo](https://kodza.dev/components/theme-toggle/) |
| [Trapdoor Menu](components/trapdoor-menu/) | Press Menu and the page swings down on its hinge like a trapdoor, showing the menu underneath: links rise as the edge passes them, an image follows your pointer. Closing replays it backwards. No GSAP. | [Demo](https://kodza.dev/components/trapdoor-menu/) |

</details>

<details>
<summary><b>Overlays</b> · 7</summary>

| Component | What it does | |
| --- | --- | --- |
| [Cookie Consent](components/cookie-consent/) | An honest cookie card: Reject weighs as much as Accept, Choose unfolds the categories, the choice is kept and a link brings the card back. | [Demo](https://kodza.dev/components/cookie-consent/) |
| [Dialog](components/modal-component/) | A real dialog that grows out of the button that opened it and goes back into it. The alert version asks you to type the name before it deletes anything. | [Demo](https://kodza.dev/components/modal-component/) |
| [Popover](components/popover/) | A panel that grows out of its trigger, arrow pointing back at it, and flips when there is no room. On click, or on hover as a hover card that stays put. | [Demo](https://kodza.dev/components/popover/) |
| [Product Tour](components/product-tour/) | A guided tour: the page dims, a spotlight cuts out each element and glides to the next, reshaping on the way, with a card that follows. Keyboard too. | [Demo](https://kodza.dev/components/product-tour/) |
| [Sheet](components/drawer/) | A panel that slides in from the right, and on phones rises from the bottom as a sheet you drag, with half and full stops and a flick to dismiss. | [Demo](https://kodza.dev/components/drawer/) |
| [Toast](components/toast-notification/) | Notifications that stack like a deck and spread out on hover. Time runs out on a thin line, a swipe dismisses, and a loading toast turns into a success. | [Demo](https://kodza.dev/components/toast-notification/) |
| [Tooltip](components/tooltip-component/) | One bubble per group: it waits on the first hover, then glides from button to button, resizing to its words, with the keyboard shortcut inside. | [Demo](https://kodza.dev/components/tooltip-component/) |

</details>

<details>
<summary><b>Feedback & loading</b> · 6</summary>

| Component | What it does | |
| --- | --- | --- |
| [Alert](components/alert/) | A message in the page: note, success, warning or error, told apart by the icon, not by color. The icon draws itself, a dismissed alert folds away and an error unfolds its log. | [Demo](https://kodza.dev/components/alert/) |
| [Empty State](components/empty-state/) | What a list shows when it is empty: a CSS drawing that answers when you come near, a line in a human voice and the next step. A second take for searches that find nothing. | [Demo](https://kodza.dev/components/empty-state/) |
| [Progress](components/progress-bar/) | A bar or a ring driven by data-value: the percentage rolls like an odometer, a segment slides while nobody knows, and at 100 a tick draws itself. | [Demo](https://kodza.dev/components/progress-bar/) |
| [Skeleton](components/skeleton-loader/) | Bones drawn from the content itself, one shine across them all. When it loads, a soft edge sweeps down and turns each bone into its line; late images keep theirs. | [Demo](https://kodza.dev/components/skeleton-loader/) |
| [Spinner](components/loading-spinner/) | A loading status sized on its text: a breathing ring, twelve bars, three dots or a terminal braille cell. Add .is-done and a tick draws itself while the words roll. | [Demo](https://kodza.dev/components/loading-spinner/) |
| [Top Loading Bar](components/top-loading-bar/) | The thin line at the top of the screen while a page loads: it creeps in shrinking steps, runs to the end and slips off to the right. Starts by itself on the site's links. | [Demo](https://kodza.dev/components/top-loading-bar/) |

</details>

<details>
<summary><b>Data display</b> · 15</summary>

| Component | What it does | |
| --- | --- | --- |
| [Accordion](components/accordion-component/) | Questions that open on their answer, on a native <details>: the panel opens at its real height, the answer rises, the plus turns into a minus. One open at a time if you like. | [Demo](https://kodza.dev/components/accordion-component/) |
| [Avatar](components/avatar/) | Initials or a picture in four sizes, a status told by a shape (full, ring, bar, faded), and a group that spreads when you come near, the face you point at saying its name. | [Demo](https://kodza.dev/components/avatar/) |
| [Badge](components/badge/) | Small labels: soft, solid, live, mono and a count that rolls. Remove a tag and it shrinks away while its neighbours glide to their new place, across lines too. | [Demo](https://kodza.dev/components/badge/) |
| [Code Block](components/code-block/) | Code to read and copy: file name, line numbers, highlighted and folded lines, a monochrome syntax in weight and light. Copy rolls to Copied and takes everything, folded lines too; a terminal copies its commands only. | [Demo](https://kodza.dev/components/code-block/) |
| [Countdown](components/event-day-counter/) | A live countdown to a date: every digit that changes falls out of its window as the next one drops in, and at zero the figures step aside for your message. Large or inline. | [Demo](https://kodza.dev/components/event-day-counter/) |
| [Counter](components/counter-animation/) | A figure that rolls into place like an odometer when it comes into view: digits on the right spin more and land last, a zero takes a full turn. Readable without the script. | [Demo](https://kodza.dev/components/counter-animation/) |
| [Departure Board](components/departure-board/) | The next departures from a place, worked out at its own time: the day's timetable by season and weekday, the next trip on top with a countdown that rolls every minute, gone trips faded, a line once the day is over. | [Demo](https://kodza.dev/components/departure-board/) |
| [Filter Transitions](components/filter-transitions/) | A filterable grid: the ink pill slides to the filter, leaving cards step back, the others glide to their new place and the new ones arrive in turn. | [Demo](https://kodza.dev/components/filter-transitions/) |
| [Kbd](components/kbd/) | Keyboard keys with a little depth, alone, in a combo or in a list of shortcuts. Type one for real and its keys sink as you press them; the whole combo down lights its line. | [Demo](https://kodza.dev/components/kbd/) |
| [Menu Board](components/menu-board/) | A restaurant menu by service: dish, original name, a tabular price on a dotted leader, marks in icon and words. Opens on the service served now; tabs, or stacked with pinned titles (data-layout="stack"). | [Demo](https://kodza.dev/components/menu-board/) |
| [Separator](components/separator/) | Lines that draw themselves from their middle when they come into view: a plain rule, one with a label or a section title, one around a CSS dot, and verticals between items. | [Demo](https://kodza.dev/components/separator/) |
| [Show More](components/collapsible/) | Long content kept short until asked: a text cut by a soft fade, or a list that says how many items are left. It opens at its real height and the button's words roll. | [Demo](https://kodza.dev/components/collapsible/) |
| [Stat Card](components/stat-card/) | A key figure, its change and the curve behind it: the figure rolls, the curve draws itself and a guide follows your pointer with the value of the day. Trends told by arrows. | [Demo](https://kodza.dev/components/stat-card/) |
| [Table](components/table/) | A data table that sorts when you click a column: rows glide to their new place, the sorted column gets a soft band, the header stays on top and the edges fade while it scrolls. | [Demo](https://kodza.dev/components/table/) |
| [Timeline](components/timeline-component/) | Dated steps along a rail that fills as you scroll: each dot fills when the ink reaches it, each step rises into place the first time it is seen, the last one reached stays marked. | [Demo](https://kodza.dev/components/timeline-component/) |

</details>

<details>
<summary><b>Cards</b> · 5</summary>

| Component | What it does | |
| --- | --- | --- |
| [Border Trace Card](components/hover-gradient-card/) | On hover a single line draws the card border from the exact point where the pointer came in. One way, both ways, or just the corners. | [Demo](https://kodza.dev/components/hover-gradient-card/) |
| [Card](components/card/) | An editorial card, clickable as a whole through one link: the image drifts closer, the border firms up and an arrow slides in. | [Demo](https://kodza.dev/components/card/) |
| [Expandable Card](components/expandable-card/) | A row of cards where one is always open: click another and it widens while the others step back. Stacked on small screens. | [Demo](https://kodza.dev/components/expandable-card/) |
| [Pricing Plans](components/pricing-plans/) | Three plans in one block, the featured one inked and lifted out. Switch to yearly and only the digits that change roll to their new value. | [Demo](https://kodza.dev/components/pricing-plans/) |
| [Sticky Cards](components/sticky-cards/) | Cards that stack as you scroll, each covered card stepping back and darkening. Plain position: sticky and a few lines of JS. No GSAP. | [Demo](https://kodza.dev/components/sticky-cards/) |

</details>

<details>
<summary><b>Media</b> · 6</summary>

| Component | What it does | |
| --- | --- | --- |
| [Before / After](components/before-after/) | Two pictures in one frame and a handle between them: drag it, click and it glides, or use the arrow keys. It nudges once when first seen; the labels step aside. | [Demo](https://kodza.dev/components/before-after/) |
| [Carousel](components/carousel/) | A native scroll-snap carousel that works before the script loads. Then: page buttons, a rolling count, a progress bar or dots, and mouse drag with a throw. Never steals the wheel. | [Demo](https://kodza.dev/components/carousel/) |
| [Fullscreen Slider](components/slider-horizontal-fullscreen/) | Full-bleed slides that change with a curtain while the title rises from a mask. Horizontal or vertical, buttons, arrow keys and swipe. No GSAP. | [Demo](https://kodza.dev/components/slider-horizontal-fullscreen/) |
| [Image Gallery](components/image-gallery/) | An editorial image grid: each image grows into a fullscreen viewer in one continuous motion, with curtain transitions between images and keyboard and swipe support. | [Demo](https://kodza.dev/components/image-gallery/) |
| [Lightbox](components/lightbox/) | Wrap an article and every picture in it opens large: it grows from its own place to the screen, arrows or a swipe go to the next, and it returns to its place on Escape. | [Demo](https://kodza.dev/components/lightbox/) |
| [Zoom Lens](components/zoom-lens/) | A closer look under the pointer: a round lens follows with a little lag and shows the detail from a sharper file, or the picture itself zooms towards the pointer. | [Demo](https://kodza.dev/components/zoom-lens/) |

</details>

<details>
<summary><b>Text effects</b> · 9</summary>

| Component | What it does | |
| --- | --- | --- |
| [Annotated Text](components/text-highlight/) | Hand-drawn marks that draw themselves on key words when the paragraph shows up: underline, strike, circle or marker. | [Demo](https://kodza.dev/components/text-highlight/) |
| [Eye Glyph](components/eye-glyph/) | Any letter with a hole becomes an eye: the pupil follows the pointer, lashes grow on top, and real lids close it when it blinks. Poke one and it winks. | [Demo](https://kodza.dev/components/eye-glyph/) |
| [Inline Image Text](components/inline-image-text/) | A large sentence with small pictures set in its lines, at letter height. Lines rise from their mask and each picture opens as its line lands. Sized in em; a muted loop works too. | [Demo](https://kodza.dev/components/inline-image-text/) |
| [Marquee](components/scrolling-text-loop/) | An endless ticker that never jumps, eases to a stop under the pointer and fades at both edges. Runs either way, with words or with logos, every logo given the same visual weight. | [Demo](https://kodza.dev/components/scrolling-text-loop/) |
| [Scroll Text Reveal](components/animated-text-reveal/) | Words light up one after the other as a paragraph scrolls by, and dim again on the way back. Fade, blur or rise. No GSAP. | [Demo](https://kodza.dev/components/animated-text-reveal/) |
| [Shimmer Text](components/text-shimmer/) | A band of light that sweeps across text, the way a busy interface says "still working on it". Looping, on hover, or following the pointer. | [Demo](https://kodza.dev/components/text-shimmer/) |
| [Text Reveal](components/text-split-scroll-reveal/) | Text that writes itself in when it reaches the screen: lines rising from a mask, words coming into focus, or letters. Plays once. | [Demo](https://kodza.dev/components/text-split-scroll-reveal/) |
| [Typewriter](components/typewriter-effect/) | Phrases typed with a human rhythm and an honest caret. Retypes only what changes, or selects it like an editor before typing over it. | [Demo](https://kodza.dev/components/typewriter-effect/) |
| [Word Rotator](components/word-rotator/) | One word of a sentence keeps changing: the next one's letters rise as the old ones leave, or the word flips over. The space follows the word, the sentence moves along. | [Demo](https://kodza.dev/components/word-rotator/) |

</details>

<details>
<summary><b>Image effects</b> · 9</summary>

| Component | What it does | |
| --- | --- | --- |
| [Direction-Aware Hover](components/direction-aware-hover/) | Tiles whose caption, or a second photo, slides in from the edge the pointer comes from and leaves by the edge it goes out. The keyboard opens it from the bottom; on touch the caption sits under the photo. | [Demo](https://kodza.dev/components/direction-aware-hover/) |
| [Expanding Panels](components/expanding-panels/) | Full-height photo panels side by side: the one you hover, focus or tap widens as the others close in, its spine title slides away and rises upright with a line of text and a link. Stacked when narrow. | [Demo](https://kodza.dev/components/expanding-panels/) |
| [Hover List Preview](components/hover-list-preview/) | Point at a row and its picture shows in one frame that follows the pointer, wiping to the next picture as you move down the list. Panel mode, keyboard and touch thumbnails included. | [Demo](https://kodza.dev/components/hover-list-preview/) |
| [Image Hover](components/image-scale/) | Four ways for an image to answer the pointer, inside its own frame: a slow zoom, coming into focus, rounding off, or drifting with the cursor. | [Demo](https://kodza.dev/components/image-scale/) |
| [Image Reveal](components/image-reveal/) | A picture that unveils itself when it comes into view: a curtain opens from below, from the side or like an iris while the picture settles from a slight zoom. | [Demo](https://kodza.dev/components/image-reveal/) |
| [Ken Burns Slider](components/ken-burns-slider/) | A background slideshow behind fixed words: each photo drifts slowly toward its point of interest, and the next is uncovered by a slow curtain in the same direction. A thin line counts the time, with a pause button. | [Demo](https://kodza.dev/components/ken-burns-slider/) |
| [Make Way Grid](components/make-way-grid/) | A grid of pictures where the one you click takes two by two cells and the others slide out of its way, then its caption card unfolds from the name pill. Two columns in narrow containers. | [Demo](https://kodza.dev/components/make-way-grid/) |
| [Pixel Reveal](components/pixel-reveal/) | Lazy images come into focus: a flat placeholder holds their place, then the decoded image is drawn on a canvas in four pixel steps before turning sharp. Cached images show at once. | [Demo](https://kodza.dev/components/pixel-reveal/) |
| [Progressive Blur](components/progressive-blur/) | A blur that builds up toward an edge with no hard line, eight backdrop-filter layers deep. Under a photo caption, under a bar on top of a list, at the bottom of what scrolls. CSS only. | [Demo](https://kodza.dev/components/progressive-blur/) |

</details>

<details>
<summary><b>Backgrounds & textures</b> · 9</summary>

| Component | What it does | |
| --- | --- | --- |
| [Caustics](components/caustics/) | A hero over the floor of a pool in the sun: a net of bright lines ray-traced by native WebGL 2 from two dozen swells, and calm water under the text. | [Demo](https://kodza.dev/components/caustics/) |
| [Cymatics](components/cymatics/) | A hero beside a speaker drawn in sand: the frame and screws hold their lines while the cone rings through a sweeping tone, its sand sliding to one to five still circles. A woofer, or the whole box. | [Demo](https://kodza.dev/components/cymatics/) |
| [Dimension Lines](components/dimension-lines/) | A hero dimensioned like a technical drawing: arrowed lines measure its real margins, columns, title and height, and recompute on resize. They open one by one on entry. | [Demo](https://kodza.dev/components/dimension-lines/) |
| [Dot Map](components/dot-map/) | A hero over a world map in fine dots, framed on the places you list. Each one shows its local time, and a ring tours them, lighting the land it crosses. A plain list without the script. | [Demo](https://kodza.dev/components/dot-map/) |
| [Grain](components/grain/) | Film grain from one inline SVG noise, jumping ten times a second like the next frame of a roll: under the words of a section, over its photo. The specks take your two colours. Nothing to download. | [Demo](https://kodza.dev/components/grain/) |
| [Interactive Dots](components/interactive-dots/) | A hero over a field of fine dots. The pointer pushes them aside like a hand in sand, they spring back, and a click sends a wave across. One canvas, asleep when nobody is looking. | [Demo](https://kodza.dev/components/interactive-dots/) |
| [Pattern Background](components/pattern-background/) | A hero framed by its own pattern: the grid lines up on your content, four hairlines run along its edges with crop marks on the corners, the rest fades out. Grid, dots, crosses or diagonals. No images. | [Demo](https://kodza.dev/components/pattern-background/) |
| [Ruled Paper](components/ruled-paper/) | A section ruled like a notebook page, with an ink margin line. The rules follow the text's line height and every line of text sits on its rule, at every size. | [Demo](https://kodza.dev/components/ruled-paper/) |
| [Topographic Lines](components/topographic-lines/) | A hero over a contour map drawn by a native WebGL shader: the lines drift very slowly, the pointer raises a hill under it, and they thin out under the text. Plain CSS rings without WebGL. | [Demo](https://kodza.dev/components/topographic-lines/) |

</details>

<details>
<summary><b>Scroll</b> · 13</summary>

| Component | What it does | |
| --- | --- | --- |
| [Back to Top](components/back-to-top/) | A round button that shows up a screen down, its ring filling as you read. Its label unrolls on hover, the arrow takes off when you click. | [Demo](https://kodza.dev/components/back-to-top/) |
| [Horizontal Scroll](components/horizontal-scroll/) | A section that pins itself while its cards slide sideways as you scroll down. Pictures drift in their frames, the counter rolls. A swipe on touch. | [Demo](https://kodza.dev/components/horizontal-scroll/) |
| [Image Split Cards](components/image-split-cards/) | One image laid over a row of cards. Pinned while you scroll, it splits along the gaps, then each piece turns over to show its card, one after the other. Scroll back and the picture comes back together. | [Demo](https://kodza.dev/components/image-split-cards/) |
| [Infinite Scroll](components/infinite-scroll/) | Placeholders the size of a post shimmer in, then turn into the posts without a jump. Two loads on their own, then a button, so the footer stays reachable. | [Demo](https://kodza.dev/components/infinite-scroll/) |
| [Inner Parallax Image](components/inner-parallax-image/) | A picture that drifts slower than the page inside a frame that stays put. It wraps the image WordPress writes in its own frame, and the picture overhangs by its whole travel, so no gap ever shows. | [Demo](https://kodza.dev/components/inner-parallax-image/) |
| [Media Expand](components/media-expand/) | An image or a video in a rounded frame, set in from the edges, takes the full width as the scroll brings it to the middle of the screen. The corners square off, the caption rises, and it all reverses on the way back up. | [Demo](https://kodza.dev/components/media-expand/) |
| [Reading Progress](components/reading-progress/) | A thin line under the header that fills as you read the article, not the whole page. Cut at each section, it can show the minutes left, and runs on the scroll itself where the browser can. | [Demo](https://kodza.dev/components/reading-progress/) |
| [Scroll Gauge](components/scroll-gauge/) | A figure pinned in a corner of a long page. Each section carries its value, and as you read, the figure rolls to it digit by digit, with its unit, a note and a scale of the whole story. | [Demo](https://kodza.dev/components/scroll-gauge/) |
| [Scroll Reveal](components/fade-in-scroll/) | Blocks make their entrance as they scroll in: a fade, lines rising from a mask, or an image unveiled by clip-path. Blocks that arrive together take turns. | [Demo](https://kodza.dev/components/fade-in-scroll/) |
| [Scroll Sequence](components/scroll-sequence/) | A numbered series of pictures drawn on one canvas as the scroll runs through a section that holds the screen. Captions come in on cue, and the frames load coarse to fine: a fast scroll never shows a blank. | [Demo](https://kodza.dev/components/scroll-sequence/) |
| [Section Tone Shift](components/section-tone-shift/) | The page turns from paper to ink as a marked section takes the middle of the screen, the colour following the scroll. The text changes side halfway, and an event tells your header. | [Demo](https://kodza.dev/components/section-tone-shift/) |
| [Sticky Scroll Reveal](components/sticky-scroll-reveal/) | A block that pins itself while big statements take turns as you scroll: each line leaves through its own mask while the next one rises. | [Demo](https://kodza.dev/components/sticky-scroll-reveal/) |
| [Sticky Steps](components/sticky-steps/) | A picture pinned on one side, steps scrolling on the other: each step draws its picture over the last like a curtain, and the counter rolls along. | [Demo](https://kodza.dev/components/sticky-steps/) |

</details>

<details>
<summary><b>Cursor</b> · 1</summary>

| Component | What it does | |
| --- | --- | --- |
| [Custom Cursor](components/hover-custom-cursor/) | Inside its zone the pointer becomes a dot with a soft lag, and a pill that says what a click will do over each item. No GSAP. | [Demo](https://kodza.dev/components/hover-custom-cursor/) |

</details>

<details>
<summary><b>Preloaders & transitions</b> · 7</summary>

| Component | What it does | |
| --- | --- | --- |
| [Curtain Transition](components/curtain-transition/) | Between two real pages, an ink panel rises with the name of the next page, then lifts off onto it. Back plays it in reverse. Curved edge or from the top. Chrome, Edge, Safari. | [Demo](https://kodza.dev/components/curtain-transition/) |
| [Landing Reveal](components/landing-reveal/) | A preloader that counts the files your hero really needs while its images rise onto a pile. At 100 the hero image comes up last and grows into place, then the title rises. Click or any key skips. No GSAP. | [Demo](https://kodza.dev/components/landing-reveal/) |
| [Logo Collapse](components/logo-collapse/) | The logo fills the screen while the page loads, then flies into the header as the screen rolls up. Its line tracks the real load. Any click or key skips it; data-once plays it once per visit. | [Demo](https://kodza.dev/components/logo-collapse/) |
| [Page Lift](components/page-lift/) | Between two real pages, the one you leave recedes as the next rises over it on a rounded edge. The header stays, back plays it in reverse. Chrome, Edge, Safari; Firefox loads plainly for now. No GSAP. | [Demo](https://kodza.dev/components/page-lift/) |
| [Shared Element Morph](components/shared-element-morph/) | Between two real pages, the picture you click grows into its place on the next page while the rest of it plays its entrance. Back, it shrinks into its card. Chrome, Edge, Safari. | [Demo](https://kodza.dev/components/shared-element-morph/) |
| [Soft Swap](components/soft-swap/) | Between two real pages, the one you leave fades out drifting up while the next slides in from just below, and the header stays put. CSS only, no script. Chrome, Edge, Safari; Firefox loads plainly for now. | [Demo](https://kodza.dev/components/soft-swap/) |
| [Stairs Transition](components/stairs-transition/) | Between two real pages, five ink bands climb over the page like a staircase, then step off onto the next one. Back starts from the other edge. Chrome, Edge, Safari. | [Demo](https://kodza.dev/components/stairs-transition/) |

</details>

<details>
<summary><b>SVG & Drawing</b> · 6</summary>

| Component | What it does | |
| --- | --- | --- |
| [Annotation Arrow](components/annotation-arrow/) | A note that draws a hand-drawn arrow to the element it points at, picked by a CSS selector. The curve avoids both boxes and redraws when the layout moves. | [Demo](https://kodza.dev/components/annotation-arrow/) |
| [Hover Icons](components/hover-icons/) | Stroke icons that act out their meaning on hover or keyboard focus: the bell rings, the bin lifts its lid, the plane flies off and back, the cog turns, refresh spins, the padlock opens. CSS only. | [Demo](https://kodza.dev/components/hover-icons/) |
| [Morph Icons](components/morph-icons/) | Icon buttons whose strokes travel into the other icon: play to pause, sound to mute, plus to close, list to grid. They follow aria-pressed or aria-expanded and fire kodza:morph-icons. | [Demo](https://kodza.dev/components/morph-icons/) |
| [Path Draw](components/path-draw/) | Any SVG drawn with strokes draws itself stroke by stroke at a steady pen speed, then fills in. Once on entering the screen, or tied to the scroll. | [Demo](https://kodza.dev/components/path-draw/) |
| [Scroll Path](components/scroll-path/) | A line drawn through the steps of a section as you read: it swings from step to step, fills each marker it reaches and ends with a ring around the button. | [Demo](https://kodza.dev/components/scroll-path/) |
| [Section Curve](components/section-curve/) | A section whose top edge comes up curved and pulls flat as it lands, tied to the scroll; scroll back up and it bends again. | [Demo](https://kodza.dev/components/section-curve/) |

</details>

<details>
<summary><b>Hero</b> · 17</summary>

| Component | What it does | |
| --- | --- | --- |
| [Hero Centered](components/hero-centered/) | A centred hero with an announcement pill, a headline whose lines rise out of their masks, one sentence and two pill buttons. CSS only, the entrance plays on load. | [Demo](https://kodza.dev/components/hero-centered/) |
| [Hero Collage](components/hero-collage/) | A centred hero with pictures scattered around the title: they open one after the other, then follow the mouse a little, each at its own depth. | [Demo](https://kodza.dev/components/hero-collage/) |
| [Hero Cover](components/hero-cover/) | A cover hero: a full-width picture under a monochrome veil, the title at the bottom left. The picture opens from the top edge, the title lines rise. A modifier sets it mid-page, played on scroll. | [Demo](https://kodza.dev/components/hero-cover/) |
| [Hero Event](components/hero-event/) | An event hero that counts down to the start date in its markup, each digit dropping out of its window, then gives way to "Live now" at the start and to the replay link at the end. | [Demo](https://kodza.dev/components/hero-event/) |
| [Hero Exit](components/hero-exit/) | A centred title in two big lines. On scroll the scene holds, the lines part, a picture opens between them and tightens into a card, then the next section slides over it. | [Demo](https://kodza.dev/components/hero-exit/) |
| [Hero Expand](components/hero-expand/) | A big title with a small picture set between two words. On scroll the scene pins, the picture opens to full screen and pushes the words aside, then a caption and a button rise. Scroll back up: it rewinds. | [Demo](https://kodza.dev/components/hero-expand/) |
| [Hero Focus](components/hero-focus/) | A title sharp over a blurred picture. On scroll the focus moves to the picture, the title blurs and leaves, a readout counts the distance, then notes point out the details. It rewinds. | [Demo](https://kodza.dev/components/hero-focus/) |
| [Hero Open](components/hero-open/) | A hero for a place with opening hours: a status line works out, at the place's own time, if it's open ("Open now · closes 23:00", "Closes in 25 min") and rolls to the new words on the minute. | [Demo](https://kodza.dev/components/hero-open/) |
| [Hero Paths](components/hero-paths/) | A hero that splits visitors in two: a title, then two tall pictures that are links, and the one under the pointer widens while its call to action rises. | [Demo](https://kodza.dev/components/hero-paths/) |
| [Hero Rotate](components/hero-rotate/) | A studio hero whose headline changes one word at a time: the next word rolls up into place while a matching picture opens over the last one, in the same stroke. A ring around the pause button shows the time left. | [Demo](https://kodza.dev/components/hero-rotate/) |
| [Hero Screen](components/hero-screen/) | A centred title and its buttons over a screenshot of the product, leaning back in perspective. On scroll the screen stands up to face you and grows while the title steps back. | [Demo](https://kodza.dev/components/hero-screen/) |
| [Hero Search](components/hero-search/) | A hero with a real search card: Buy and Rent swap the budget list under a sliding pill, the place field rolls through its examples, the selects unroll like Kodza Select, and the result count rolls in the button. | [Demo](https://kodza.dev/components/hero-search/) |
| [Hero Showcase](components/hero-showcase/) | A title over a wall of project thumbnails laid back like prints on a table. On scroll the rows slide in opposite directions and click into line as the wall stands up, every thumbnail a link. | [Demo](https://kodza.dev/components/hero-showcase/) |
| [Hero Showreel](components/hero-showreel/) | A showreel hero: a muted loop under the title and a Play reel pill that follows the pointer. A click grows the pill into a player with sound, pause, mute and a seek track. | [Demo](https://kodza.dev/components/hero-showreel/) |
| [Hero Split](components/hero-split/) | A split hero, words on the left and a 4:5 picture on the right: the title lines rise out of their masks while the picture opens from the top edge down. | [Demo](https://kodza.dev/components/hero-split/) |
| [Hero Statement](components/hero-statement/) | A studio statement set very large over a mono line with the city, a live local time and the booking window. The words rise out of their masks one after the other on load. | [Demo](https://kodza.dev/components/hero-statement/) |
| [Hero Wordmark](components/hero-wordmark/) | A hero that sets the name across the whole width, ink edge to ink edge: its letters rise one by one and a wide picture opens right under them. | [Demo](https://kodza.dev/components/hero-wordmark/) |

</details>

<details>
<summary><b>Content sections</b> · 7</summary>

| Component | What it does | |
| --- | --- | --- |
| [Key Points](components/key-points/) | Three to six facts on 1 px hairlines that draw across as each row comes into view: a term and its sentence in rows, or columns. A big figure can lead each point, its digits rolling into place. | [Demo](https://kodza.dev/components/key-points/) |
| [Media Collage](components/media-collage/) | A text beside three pictures of different shapes set off from each other, the wide one running out to the screen edge. The text stays in view, and each picture is uncovered from its top edge in turn. | [Demo](https://kodza.dev/components/media-collage/) |
| [Media Text](components/media-text/) | A content section with a picture on one side and the words on the other. Rows alternate sides on their own, a picture beside a long text stays put as you scroll, and each row enters as it comes into view. | [Demo](https://kodza.dev/components/media-text/) |
| [Media Wide](components/media-wide/) | One wide picture between a head and a few short notes: title and intro side by side, the picture across the column (or the whole screen) uncovered from its top edge, then a mono caption. | [Demo](https://kodza.dev/components/media-wide/) |
| [Section Intro](components/section-intro/) | The head of a section on its own: a mono label, a tight title and a short intro, set beside the title on its first line, under it or centred. It plays its entrance once, as it comes into view. | [Demo](https://kodza.dev/components/section-intro/) |
| [Statement](components/statement/) | One big sentence of two to four lines, with a mono label in the indent of its first line. Its lines rise from their masks as it comes into view. A modifier makes it a quote with the name and role. | [Demo](https://kodza.dev/components/statement/) |
| [Text Section](components/text-section/) | A section of running text: the title stays in view on the left while the text, kept to 64 characters a line, scrolls past. It takes paragraphs, lists and quotes as they are. A modifier sets it on two columns. | [Demo](https://kodza.dev/components/text-section/) |

</details>

<details>
<summary><b>Feature sections</b> · 8</summary>

| Component | What it does | |
| --- | --- | --- |
| [Bento Grid](components/bento-grid/) | A bento section in boxes of 1, 2 or 4 cells that pack without holes: pictures, figures that roll in, small screens that play once, one ink box at most. Boxes open in reading order; --ruled turns them into a board. | [Demo](https://kodza.dev/components/bento-grid/) |
| [Bento Scroll](components/bento-scroll/) | A bento section that opens on its main picture, full screen, title on it. On scroll the picture goes back into its box and the others rise around it. It rewinds. | [Demo](https://kodza.dev/components/bento-scroll/) |
| [Feature Accordion](components/feature-accordion/) | A product tour: the features in a list beside one screen, each visual opening from the top over the last. It moves on by itself and holds on hover or a pick; --tabs puts the features above one wide visual. | [Demo](https://kodza.dev/components/feature-accordion/) |
| [Feature Compare](components/feature-compare/) | Without and with on one grid, each line level with its answer, yours on a card of ink. A phone switch rolls the lines over. --table: columns, yours in an ink pill. | [Demo](https://kodza.dev/components/feature-compare/) |
| [Feature Grid](components/feature-grid/) | Features in 3 or 4 columns on hairlines that never double up or hang loose, at any width. A linked cell is a link as a whole, its arrow passing through. Cells rise row by row; --cards sets them apart. | [Demo](https://kodza.dev/components/feature-grid/) |
| [Feature List](components/feature-list/) | Everything a product includes, in groups set out in columns: a tick, a label and a Pro or Soon tag. Each group shows its first lines, one button unfolds them all at their real height. | [Demo](https://kodza.dev/components/feature-list/) |
| [Screen Callouts](components/screen-callouts/) | A picture and its numbered features, each with its zone in %. Picking one veils the rest, the cut-out glides from zone to zone and the picture leans in. | [Demo](https://kodza.dev/components/screen-callouts/) |
| [Service List](components/service-list/) | An agency's services as large numbered rows on hairlines. A row opens to two lines, its deliverables, a starting price and a lead time, and a link. Native details underneath, one row open at a time. | [Demo](https://kodza.dev/components/service-list/) |

</details>

<details>
<summary><b>Header</b> · 7</summary>

| Component | What it does | |
| --- | --- | --- |
| [Header Announcement](components/header-announcement/) | A site header with a strip of news on top: messages roll and pause on hover or focus; the cross folds the strip, the header slides up without a jump, and it stays closed. Below 900 px, a shutter menu. | [Demo](https://kodza.dev/components/header-announcement/) |
| [Header Centered](components/header-centered/) | A centred header for a restaurant or a shop: the name in the middle, links on both sides, a line above that says whether it's open now. On scroll the bar tightens; below 900 px, a full-screen menu. | [Demo](https://kodza.dev/components/header-centered/) |
| [Header Classic](components/header-classic/) | A site header with a logo, links and one button: a line glides under the links, front edge first, and returns under the current page; below 900 px the links become a shutter menu. | [Demo](https://kodza.dev/components/header-classic/) |
| [Header Grid](components/header-grid/) | A site header placed on your grid: brand, links and actions each take the columns you name, one link per column if you like. Still by default; a gliding line, hide on scroll or tighten on scroll as options. | [Demo](https://kodza.dev/components/header-grid/) |
| [Header Mega](components/header-mega/) | A full site header whose mega menus share one panel: from a link to the next it changes shape and slides instead of closing, a soft pill follows the pointer, and below 900 px the links become a drawer with levels. | [Demo](https://kodza.dev/components/header-mega/) |
| [Header Overlay](components/header-overlay/) | A transparent header over the hero photo: once the hero passes under it, a solid bar comes down and the text turns dark along its edge; below 900 px, a full-screen menu. | [Demo](https://kodza.dev/components/header-overlay/) |
| [Header Shop](components/header-shop/) | A shop header: the name, the categories, a search that opens over them, the account and a bag whose count rolls when something is added. Below 900 px, a menu the page steps aside for. | [Demo](https://kodza.dev/components/header-shop/) |

</details>

<details>
<summary><b>Footer</b> · 6</summary>

| Component | What it does | |
| --- | --- | --- |
| [Footer Columns](components/footer-columns/) | A site footer: the logo and a line, up to five columns of links under mono titles, a bottom row with the year, legal pages and Back to top; under a link, a line comes in from the left. | [Demo](https://kodza.dev/components/footer-columns/) |
| [Footer Contact](components/footer-contact/) | A freelance or studio footer: the email address across the whole width, copied on a click while the line under it rolls to Copied, the local time to the minute, the networks in big rows. | [Demo](https://kodza.dev/components/footer-contact/) |
| [Footer Minimal](components/footer-minimal/) | A one-line site footer: the logo, the ©, three links and Back to top, whose arrow rolls up on hover and which scrolls up smoothly; on phones, two centred lines. | [Demo](https://kodza.dev/components/footer-minimal/) |
| [Footer Shop](components/footer-shop/) | A shop footer: four promises with icons, a newsletter field whose button rolls to Subscribed, columns that fold on phones, a country and currency menu, the payment methods. | [Demo](https://kodza.dev/components/footer-shop/) |
| [Footer Venue](components/footer-venue/) | A footer for a place with opening hours: address and Directions, the week with today under an ink pill, a status worked out at the place's own time that rolls when it changes, the phone and Book. | [Demo](https://kodza.dev/components/footer-venue/) |
| [Footer Wordmark](components/footer-wordmark/) | A site footer that waits under the page: its content rises slower than the scroll while a shade lifts off it, and the brand name is set across the whole width, ink edge to ink edge, its letters rising from their masks. | [Demo](https://kodza.dev/components/footer-wordmark/) |

</details>

<details>
<summary><b>Testimonials & logos</b> · 6</summary>

| Component | What it does | |
| --- | --- | --- |
| [Logo Grid](components/logo-grid/) | Client logos in a hairline grid, grey and all the same weight. A cell can link to its case study: on hover or focus the logo rolls up and the result rises in. Tiers for sponsors. | [Demo](https://kodza.dev/components/logo-grid/) |
| [Logo Swap](components/logo-swap/) | More customer logos than cells: every few seconds one cell swaps its logo, the old one leaving upwards as the next rises in. Every logo weighs the same; hover or pause holds them. | [Demo](https://kodza.dev/components/logo-swap/) |
| [Quote Spotlight](components/quote-spotlight/) | One big quote at a time, faces or press logos as tabs under it: a ring fills while it is read, then the next quote rises line by line. Click, swipe or arrow keys pick one; hover or pause holds it. | [Demo](https://kodza.dev/components/quote-spotlight/) |
| [Result Quote](components/result-quote/) | A case study in one block: the result very large, its digits rolling up to the value, then the quote rising line by line, the person and a link to the full story. Played once, on scroll. | [Demo](https://kodza.dev/components/result-quote/) |
| [Review Summary](components/review-summary/) | Reviews with their summary: the average rolls up, the stars fill to the decimal, five bars fill in turn. Click a bar to filter, the reviews glide into place. Read more, and a one-line variant. | [Demo](https://kodza.dev/components/review-summary/) |
| [Testimonial Wall](components/testimonial-wall/) | A testimonials section: three columns of cards drift slowly in opposite directions, with no end and no jump, faded top and bottom. A column under the mouse slows to a stop; a pause button stops the wall. | [Demo](https://kodza.dev/components/testimonial-wall/) |

</details>

<details>
<summary><b>Contact</b> · 4</summary>

| Component | What it does | |
| --- | --- | --- |
| [Book a Visit](components/book-a-visit/) | A booking form: the coming days, the free times worked out from the opening hours, name and email. On send it rolls up into the answer, with Add to calendar as an .ics file. | [Demo](https://kodza.dev/components/book-a-visit/) |
| [Contact Brief](components/contact-brief/) | A project request section: tags for what is needed, a budget and a time frame picked on a sliding pill, name and email. A summary of the brief writes itself as you pick; sent, the form rolls into a receipt. | [Demo](https://kodza.dev/components/contact-brief/) |
| [Contact Router](components/contact-router/) | A contact section that asks what it is about first: Sales, Support, Press or Jobs. The fields become the ones that desk needs, the button names who reads it, Support links to help. Sent, it rolls into a receipt. | [Demo](https://kodza.dev/components/contact-router/) |
| [Contact Split](components/contact-split/) | A contact section: the email to copy, phone, address and a status worked out from the opening hours; a short form that rolls into the thanks. A variant for a place shows the week of hours. | [Demo](https://kodza.dev/components/contact-split/) |

</details>

<details>
<summary><b>CTA & Newsletter</b> · 1</summary>

| Component | What it does | |
| --- | --- | --- |
| [CTA Wordmark](components/cta-wordmark/) | The call at the end of a page, set across the whole width: two or three words sized to fill the line, rising one by one, a picture laid over the foot of the letters, and a button or an email field below. | [Demo](https://kodza.dev/components/cta-wordmark/) |

</details>

<details>
<summary><b>FAQ</b> · 1</summary>

| Component | What it does | |
| --- | --- | --- |
| [FAQ Split](components/faq-split/) | A two-column FAQ section: title, topics and a way out pinned on the left, questions by topic on the right, and FAQPage structured data from the page. | [Demo](https://kodza.dev/components/faq-split/) |

</details>

## About this repository

It mirrors [kodza.dev](https://kodza.dev): when a component ships or changes there, it lands here. Every file is generated, none is edited by hand, so pull requests are not merged.

## License

The [Kodza License](LICENSE). Use the components in any project, personal or commercial, client work included, no attribution needed, and the house images that come with them too. Don't resell or redistribute them, and don't offer them through another catalogue, registry or MCP server.

Use it anywhere. Don't resell it.
