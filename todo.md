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

- Fields to expose in the viewer (we already show some; add the rest):
  - title (already shown)
  - type (already shown)
  - series (already shown)
  - jim version (already shown)
  - description (add)
  - docVersion / document version (add)
  - provenance (add: source, history, imported-from, original-author)
  - tags / keywords (add)
  - author / creator (if present)
  - license (if present)

- Other useful metadata fields (optional):
  - id, created, modified, source URL
  - units, dpi, color-space, color-profile, page size/orientation

- Note about filtering and allowed fields:
  - The viewer currently filters JIM metadata and only displays an allow-list of fields. That protect users from rendering large or unexpected data blobs in the UI.
  - Update the allow-list to include `description`, `docVersion`, `provenance`, and `tags` (and any other chosen fields) so they appear in the UI.
  - Keep a maximum display length for long text (e.g., description) and provide a "show more" toggle or a link to the full metadata artifact.

- Implementation notes for the viewer:
  - Parse the JIM JSON safely (try/catch); prefer a helper that extracts only the allowed keys and returns a small object for the UI.
  - Render fields in a small metadata panel (key: value rows), use collapsible blocks for long text (description, provenance), and show tags as a pill list.
  - Add unit tests covering examples: confirm the expected keys are shown for `triangle-complete-with-jim-metadata.svg` and other examples.

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

3) Dark mode (UI only)

- Goal: provide a dark UI for the viewer controls/panels while preserving the authored SVG content (do not invert or filter SVG internals).
- Approach (straightforward):
  - Add CSS variables for UI colors and a `.dark` class on `document.documentElement` to flip them.
  - Add a visible toggle button in the UI; persist choice in `localStorage` and respect `prefers-color-scheme` by default.
  - Ensure the SVG sits on a neutral background in dark mode (do not apply color transforms to SVG content).

- Minimal CSS snippet:

```css
:root{
  --bg: #ffffff;
  --panel-bg: #f6f6f8;
  --text: #1a1a1a;
  --muted: #666;
  --accent: #0078d4;
}

html.dark{
  --bg: #0b0b0d;
  --panel-bg: #0f1113;
  --text: #e6e6e6;
  --muted: #9aa0a6;
  --accent: #58a6ff;
}

.viewer-ui { background: var(--bg); color: var(--text); }
.panel { background: var(--panel-bg); }
```

- Minimal JS to toggle and persist theme:

```js
function applyTheme(theme){
  if(theme === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}
function initTheme(){
  const stored = localStorage.getItem('jim_theme');
  if(stored){ applyTheme(stored); return; }
  const preferDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(preferDark ? 'dark' : 'light');
}
function toggleTheme(){
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('jim_theme', isDark ? 'dark' : 'light');
  const btn = document.getElementById('theme-toggle');
  if(btn) btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
}
initTheme();
// <button id="theme-toggle" aria-pressed="false" onclick="toggleTheme()">Theme</button>
```

- Tests / QA:
  - Visual smoke: toggle persists and flips UI colors.
  - Accessibility: toggle is keyboard operable and uses `aria-pressed`.
  - Ensure SVG rendering isn't altered by theme change.

4) In-viewer accessibility testing (axe)

- Goal: allow a quick accessibility scan from inside the viewer for the loaded SVG and display results in-panel.
- Recommended approach:
  - Provide an "Accessibility check" button that lazily loads `axe-core` (or uses a bundled local copy) and runs `axe.run` scoped to the SVG node.
  - Show results (violations, impact, failing nodes) in a panel with export (JSON) capability.
  - Provide a default ruleset to reduce noisy false positives for decorative SVG content; let users toggle rules.

- Minimal in-viewer code (lazy-load axe from CDN example):

```html
<button id="run-a11y">Run accessibility scan</button>
<div id="a11y-output" aria-live="polite"></div>
<script>
async function runAxeOnSvg(){
  const svg = document.querySelector('svg');
  if(!svg){ document.getElementById('a11y-output').textContent = 'No SVG found'; return; }

  if(typeof axe === 'undefined'){
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.6.3/axe.min.js';
      s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
  }

  const context = { include: [ svg ] };
  const options = { rules: { 'duplicate-id': { enabled: false } } };
  document.getElementById('a11y-output').textContent = 'Running...';
  const results = await axe.run(context, options);
  document.getElementById('a11y-output').innerHTML = formatAxeResults(results);
  window.lastAxeResults = results;
}
function formatAxeResults(results){
  if(!results.violations || results.violations.length===0) return '<div class="a11y-clean">No violations</div>';
  return results.violations.map(v => {
    const nodes = v.nodes.map(n => `<li><code>${(n.html||'').replace(/</g,'&lt;')}</code><div>${n.failureSummary||''}</div></li>`).join('');
    return `<section class="a11y-violation"><h3>${v.id} — ${v.help} (${v.impact})</h3><ul>${nodes}</ul></section>`;
  }).join('');
}
document.getElementById('run-a11y').addEventListener('click', runAxeOnSvg);
</script>
```

- Implementation notes and CI integration:
  - Bundle `axe-core` locally for offline/no-CDN operation (`npm install axe-core`) or lazy-load from CDN.
  - Use in-viewer axe for fast feedback; keep Playwright + axe for CI (the repo already has a Playwright/axe workflow).
  - Export JSON from the viewer to compare with CI or upload as an artifact.

- Tests & quality gates:
  - Playwright test that loads an example SVG and asserts no high-impact violations (or only whitelisted ones).
  - Unit test for the export and for rule overrides.

- Risks & mitigations:
  - Axe may report noisy results for decorative SVGs — provide a whitelist/ignore config.
  - Scanning the whole document instead of the SVG can include the viewer UI—scope the scan to the SVG element.

---

You can pick these up when you're ready; I can implement either or both. If you'd like implementation now, tell me which to start with (dark mode, in-viewer axe, or both) and I'll list the files I'll edit and proceed.
