#!/usr/bin/env node
/**
 * Verifies the audio-without-haptic validation fix.
 *
 * Loads three test cases via the JIM Previewer and asserts the spec-compliance
 * panel reports warnings (or does not) as expected:
 *
 *   1. fixtures/audio-only.svg            -> Behavior[0] is audio-only with string shorthand
 *                                            (should produce 1 warning about audio.href)
 *   2. world-countries (5) - fixed.svg    -> All 241 behaviors use audio object form
 *                                            (should produce 0 audio warnings)
 *   3. world-countries (5).svg            -> All 241 behaviors use string shorthand (regression)
 *                                            (should produce 241 audio warnings)
 *
 * Run: node scripts/verify-audio-validation.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const REPO_ROOT = path.resolve(__dirname, '..');
const PORT = 8765;

function serveStatic(root) {
  return http.createServer((req, res) => {
    const reqUrl = decodeURIComponent(req.url.split('?')[0]);
    const target = path.join(root, reqUrl);
    if (!target.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    fs.stat(target, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      const ext = path.extname(target).toLowerCase();
      const contentType = ({
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.svg': 'image/svg+xml; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
      })[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(target).pipe(res);
    });
  });
}

async function countAudioWarnings(page, examplePath) {
  const url = `http://127.0.0.1:${PORT}/jim-viewer.html?example=${encodeURIComponent(examplePath.replace(/^\//, ''))}`;
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  // Give the viewer a moment to load and validate
  await page.waitForTimeout(800);
  // Read warnings from the spec compliance panel
  const warningTexts = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#metadata-summary li, #metadata-summary .status-warning-line, .status-warning-line'));
    return items.map(el => (el.textContent || '').trim());
  });
  const audioWarnings = warningTexts.filter(t => /\.audio /.test(t) || /\.audio\.href/.test(t) || /audio should be an object/i.test(t));
  return { audioWarnings, allWarnings: warningTexts };
}

async function copyTestFixture() {
  // We need world-countries source files available — copy from Downloads if present
  const downloadsRoot = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');
  const sources = [
    ['world-countries (5).svg', 'fixtures/_test-world-countries-broken.svg'],
    ['world-countries (5) - fixed.svg', 'fixtures/_test-world-countries-fixed.svg'],
  ];
  const present = [];
  for (const [src, dst] of sources) {
    const srcPath = path.join(downloadsRoot, src);
    const dstPath = path.join(REPO_ROOT, dst);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, dstPath);
      present.push(dst);
    }
  }
  return present;
}

function cleanupTestFixtures() {
  ['fixtures/_test-world-countries-broken.svg', 'fixtures/_test-world-countries-fixed.svg'].forEach(rel => {
    const p = path.join(REPO_ROOT, rel);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
}

(async function main() {
  const tmpFixtures = await copyTestFixture();

  const server = serveStatic(REPO_ROOT);
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`Test server listening on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  let failures = 0;
  function check(label, actual, expected) {
    const pass = actual === expected;
    console.log(`  ${pass ? '✓' : '✗'} ${label}: actual=${actual}, expected=${expected}`);
    if (!pass) failures++;
  }

  try {
    console.log('\n[1] audio-only.svg (audio-only behavior with string shorthand + 2 valid)');
    const r1 = await countAudioWarnings(page, '/fixtures/audio-only.svg');
    // Behavior[0] = string shorthand (should warn about audio.href)
    // Behavior[1] = valid href (no warning)
    // Behavior[2] = valid earcon (no warning)
    check('audio-related warnings >= 1', r1.audioWarnings.length >= 1, true);
    check('warning mentions Behavior[0]', r1.audioWarnings.some(t => /Behavior\[0\]/.test(t)), true);

    if (tmpFixtures.includes('fixtures/_test-world-countries-broken.svg')) {
      console.log('\n[2] world-countries-broken (string shorthand on all 241 behaviors)');
      const r2 = await countAudioWarnings(page, '/fixtures/_test-world-countries-broken.svg');
      check('audio warnings count', r2.audioWarnings.length, 241);
    } else {
      console.log('\n[2] world-countries-broken: SKIPPED (source not in Downloads)');
    }

    if (tmpFixtures.includes('fixtures/_test-world-countries-fixed.svg')) {
      console.log('\n[3] world-countries-fixed (object form on all 241 behaviors)');
      const r3 = await countAudioWarnings(page, '/fixtures/_test-world-countries-fixed.svg');
      check('audio warnings count', r3.audioWarnings.length, 0);
    } else {
      console.log('\n[3] world-countries-fixed: SKIPPED (source not in Downloads)');
    }

    console.log(`\n${failures === 0 ? '✓ All checks passed' : `✗ ${failures} check(s) failed`}`);
  } finally {
    await browser.close();
    server.close();
    cleanupTestFixtures();
  }

  process.exit(failures === 0 ? 0 : 1);
})();
