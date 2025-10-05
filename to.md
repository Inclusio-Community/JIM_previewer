# TODO / Checklist

This short checklist collects the immediate follow-ups you asked for.

1) Check for JIM 0.4.1 → 0.4.2 changes

- Locate releases / changelog:
  - Look for a `CHANGELOG`, `RELEASES`, or `docs/` notes in this repository or upstream JIM repo.
  - Check `git tag -l` and compare the commits between tags (if tags exist):

```sh
# list tags
git tag -l
# compare commits between two tags (replace with actual tags/names)
git log --oneline v0.4.1..v0.4.2
```

- If there's a schema file (e.g., `jim-schema.json`, `schema.json` or similar), diff the schema files:

```sh
git show v0.4.1:schemas/jim-schema.json > /tmp/jim-0.4.1.json; \
git show v0.4.2:schemas/jim-schema.json > /tmp/jim-0.4.2.json; \
diff -u /tmp/jim-0.4.1.json /tmp/jim-0.4.2.json
```

- Things to look for between versions:
  - Added / removed JIM fields (field names changed, moved, or deprecated).
  - Field types changed (string → object, number → string, etc.).
  - Semantics changes (e.g., units, coordinate space, color model).
  - Behavior changes affecting the viewer (visibility flags, rendering hints, attribute names used by the harness).

- For the viewer/harness, run a quick compatibility smoke test:
  - Open several example SVGs (especially those containing JIM metadata) in `jim-viewer.html` and watch the console for warnings.
  - Run the Playwright/axe harness locally (you already have this) and confirm no regressions.

2) Read other JIM meta fields for document info

- Where JIM metadata typically appears in SVGs:
  - Inside an SVG `<metadata>` element (often the project puts a JSON blob there).
  - As `data-*` attributes on top-level elements (e.g., `data-jim` or `data-jim-version`).
  - In RDF/XML inside `<metadata>` or in `<desc>` elements.

- Fields you might want to extract for document info (non-exhaustive):
  - id, title, description, author, version
  - created, modified, source, license
  - units, dpi, color-space, color-profile
  - bounding box / page size, orientation
  - tags, keywords, provenance or source URL

- Suggested JS snippet (browser) to extract a JSON blob from `<metadata>`:

```js
// run in the page that loaded an <svg> element (assumes the metadata is JSON inside <metadata>)
const svg = document.querySelector('svg');
if (!svg) throw new Error('No svg found');
const metaEl = svg.querySelector('metadata');
let jim = null;
if (metaEl) {
  try {
    const text = metaEl.textContent.trim();
    // some projects embed raw JSON directly
    jim = JSON.parse(text);
  } catch (e) {
    // fallback: look for a CDATA or a nested element with JSON
    const txt = metaEl.querySelector && (metaEl.querySelector('text') || metaEl.textContent);
    try { jim = JSON.parse(txt); } catch (ex) { /* still not JSON */ }
  }
}
// now `jim` should contain metadata if present
console.log('jim meta:', jim);
```

- Suggested Node snippet to scan files in this repo for JIM metadata blobs:

```js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

glob('**/*.svg', {}, (err, files) => {
  files.forEach(f => {
    const txt = fs.readFileSync(f, 'utf8');
    const m = txt.match(/<metadata[^>]*>([\s\S]*?)<\/metadata>/i);
    if (m) {
      const content = m[1].trim();
      try {
        const j = JSON.parse(content);
        console.log(f, '-> found JSON metadata keys:', Object.keys(j).join(', '));
      } catch (e) {
        // not JSON — print first 200 chars
        console.log(f, '-> metadata (non-JSON):', content.slice(0,200).replace(/\s+/g,' '));
      }
    }
  });
});
```

Notes / next steps
- If you want I can:
  - add the above Node script under `scripts/` (e.g., `scripts/scan-jim-meta.js`) and commit it,
  - or implement an automated compatibility check that runs the schema diff and reports changed fields between versions.
