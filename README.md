# Critical AI Literacy: Terminology Map

An interactive concept map of the glossary for **AI for Everyone: Critical AI Literacy** at
Acadia University. The 25 glossary terms are drawn as a force-directed network: each term is a
node, lines connect entries that refer to one another, and node size grows with the number of
connections, so hub terms such as *Large Language Model* stand out. Clicking a term opens its
full definition alongside a list of the terms it connects to.

The site is entirely static — plain HTML, CSS, and JavaScript, with
[D3 v7](https://d3js.org/) loaded from a CDN. There is no build step and no backend.

## Features

- **Hover** a term to highlight it and its direct neighbours.
- **Click** a term to open its definition, group, and connected terms. Mentions of other
  glossary terms inside a definition are clickable.
- **Drag** nodes to rearrange the layout; **scroll or pinch** to zoom and pan, with a
  *Reset view* button.
- **Search** for a term by name; press <kbd>Enter</kbd> or click a match to select it.
- **Deep links**: `index.html#hallucination` opens the page with that term already selected,
  and the address bar updates as you browse. Handy for linking to a single term from course
  materials.
- **Keyboard and screen-reader access**: nodes are reachable with <kbd>Tab</kbd> and selected
  with <kbd>Enter</kbd>, and the full glossary is also rendered as a plain alphabetical list
  under *All terms and definitions*.
- Light and dark mode, following the operating system setting via `prefers-color-scheme`.

## Running it locally

The page loads its content with `fetch()`, and browsers block `fetch()` from `file://` URLs
for security reasons. **Opening `index.html` by double-clicking it will show an error** — you
need to serve the folder over HTTP instead. From this directory:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in a browser. Any other static server works too, for
example `npx serve` or the VS Code "Live Server" extension. Press <kbd>Ctrl</kbd>+<kbd>C</kbd>
to stop the server.

## Editing the glossary

All content lives in [`data/glossary.json`](data/glossary.json). Nothing about the terms,
definitions, groups, or links is hard-coded in `app.js`, so editing that one file updates the
map. Reload the page to see changes.

The file has three top-level keys: `groups`, `terms`, and `links`.

### Adding a term

Add an object to the `terms` array:

```json
{
  "id": "context-window",
  "name": "Context Window",
  "group": "technical",
  "definition": "The amount of text a large language model can consider at once."
}
```

- `id` — a unique, lowercase, hyphenated identifier. This is also the deep-link anchor, so
  `#context-window` will open this term. Changing an `id` breaks any existing links to it.
- `name` — the label shown on the map and in the definition panel.
- `group` — one of the keys in `groups` (`technical`, `human`, or `societal`).
- `definition` — the text shown in the panel and in the alphabetical list, used exactly as
  written. Inside JSON, double quotes must be escaped as `\"`.

A new term with no links will sit on its own and log a console warning, so add at least one
link for it.

### Adding a link

Add a two-element array of term `id`s to the `links` array. Order does not matter, and links
are undirected:

```json
["context-window", "large-language-model"]
```

Both ids must exist in `terms`; a link naming an unknown id is skipped and reported as a
console warning. Adding links changes the layout, because node size is
`5 + 2.2 × √(number of connections)`.

### Changing a group

To recolour or rename a group, edit its entry under `groups` — the legend, the node colours,
and the colour chips all read from it:

```json
"technical": { "label": "How AI works", "color": "#7F77DD" }
```

To move a term between groups, change that term's `group` value. To add a whole new group, add
a key under `groups` with a `label` and a `color`, then use that key on the relevant terms.
The current groups are:

| key | label | colour |
| --- | --- | --- |
| `technical` | How AI works | `#7F77DD` purple |
| `human` | Human effects | `#D85A30` coral |
| `societal` | Societal issues | `#1D9E75` teal |

### Checking your edits

JSON is picky about trailing commas and unescaped quotes. To verify the file parses before
publishing:

```bash
python3 -m json.tool data/glossary.json > /dev/null && echo OK
```

Then load the page and open the browser console — the site logs warnings for links that point
at missing terms and for terms with no links.

## Files

```
index.html          page structure
style.css           styling, including light/dark themes
app.js              data loading, graph, and interaction
data/glossary.json  all glossary content
```

## Deployment (GitHub Pages)

The site is served straight from the repository root on the `main` branch. The steps used to
set it up:

```bash
git init
git add .
git commit -m "Add interactive glossary concept map"
gh repo create ai-literacy-glossary --public --source=. --remote=origin --push
gh api -X POST repos/:owner/ai-literacy-glossary/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```

Without the `gh` CLI, create the repository on GitHub, push to `main`, then go to
**Settings → Pages → Build and deployment → Deploy from a branch** and choose **main** and
**/ (root)**.

To publish later changes, commit and push to `main`; Pages redeploys automatically, usually
within a minute.

Live site: <https://drlametti.github.io/ai-literacy-glossary/>
