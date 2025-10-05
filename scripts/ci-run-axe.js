#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Examples to test (same defaults used by the harness)
const defaultExamples = [
  '/examples/testimage_0.svg',
  '/examples/simple_svg_triangle.svg',
  '/examples/triangle-complete-with-jim-metadata.svg',
  '/examples/triangle-with-orphan-selectors.svg',
  '/examples/Division_of_energy_in_the_Universe.svg'
];

// Lightweight argument parsing (avoids external yargs dependency/runtime API mismatch)
function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    'base-url': 'http://127.0.0.1:8080',
    'examples': [],
    'include-svg': false,
    'out-dir': 'axe-output',
    'fail-on-violations': false
  };
  args.forEach(a => {
    if (a.startsWith('--base-url=')) out['base-url'] = a.split('=')[1];
    else if (a.startsWith('--out-dir=')) out['out-dir'] = a.split('=')[1];
    else if (a === '--include-svg') out['include-svg'] = true;
    else if (a === '--no-include-svg') out['include-svg'] = false;
    else if (a === '--fail-on-violations') out['fail-on-violations'] = true;
    else if (a.startsWith('--examples=')) out['examples'] = a.split('=')[1].split(',').map(s => s.trim()).filter(Boolean);
  });
  return out;
}

const argv = parseArgs();
const examples = (argv.examples && argv.examples.length) ? argv.examples : defaultExamples;

(async function run() {
  if (!fs.existsSync(argv['out-dir'])) fs.mkdirSync(argv['out-dir'], { recursive: true });

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  let overallViolations = 0;
  for (const ex of examples) {
    try {
      const examplePath = ex.startsWith('/') ? ex.slice(1) : ex;
      const url = `${argv['base-url'].replace(/\/$/, '')}/jim-viewer.html?example=${encodeURIComponent(examplePath)}`;
      console.log(`Visiting: ${url}`);
      const resp = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      if (!resp || !resp.ok()) {
        console.warn(`Warning: load returned status ${resp && resp.status()}`);
      }

      // Give the viewer a moment to render the SVG and any dynamic UI
      await page.waitForTimeout(500);

      // Optionally hide visualization container to exclude SVG geometry
      if (!argv['include-svg']) {
        await page.evaluate(() => {
          try {
            const viz = document.getElementById('visualization');
            if (viz) {
              viz.__ci_prev_display = viz.getAttribute('style');
              viz.style.setProperty('display', 'none', 'important');
              viz.setAttribute('aria-hidden', 'true');
            }
          } catch (e) { /* ignore */ }
        });
        // small delay after hiding
        await page.waitForTimeout(200);
      }

      // Inject axe if not present
      await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.4/axe.min.js' });

      // Run axe in the page context and collect results
      const result = await page.evaluate(async () => {
        // wait a short moment for any UI updates
        await new Promise(r => setTimeout(r, 200));
        // axe is expected to be available globally
        if (!window.axe) throw new Error('axe not found in page');
        const res = await window.axe.run(document);
        return res;
      });

      const base = path.basename(examplePath).replace(/[^a-zA-Z0-9_.-]/g, '_');
      const outPath = path.join(argv['out-dir'], `axe-${base}.json`);
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
      console.log(`Wrote ${outPath} — violations: ${(result.violations||[]).length}, incomplete: ${(result.incomplete||[]).length}`);

      overallViolations += (result.violations || []).length;

      // restore hidden viz (best-effort)
      if (!argv['include-svg']) {
        await page.evaluate(() => {
          try {
            const viz = document.getElementById('visualization');
            if (viz) {
              if (viz.__ci_prev_display !== null) viz.setAttribute('style', viz.__ci_prev_display);
              else viz.removeAttribute('style');
              if (viz.getAttribute('aria-hidden') === 'true') viz.removeAttribute('aria-hidden');
            }
          } catch (e) { /* ignore */ }
        });
      }

    } catch (err) {
      console.error('Error while processing', ex, err && err.message ? err.message : err);
    }
  }

  await browser.close();

  console.log(`Total violations across examples: ${overallViolations}`);
  if (argv['fail-on-violations'] && overallViolations > 0) {
    console.error('Failing due to violations');
    process.exit(2);
  }
  process.exit(0);
})();
