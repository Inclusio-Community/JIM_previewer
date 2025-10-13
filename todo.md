# TODO / Checklist
This short checklist collects the immediate follow-ups you asked for.

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
