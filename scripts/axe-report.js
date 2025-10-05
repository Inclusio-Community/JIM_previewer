#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node scripts/axe-report.js <axe-json-file> [--fail-on-violations] [--top N]');
  process.exit(1);
}

const argv = process.argv.slice(2);
if (!argv[0]) usage();
const inputPath = argv[0];
const failOnViolations = argv.includes('--fail-on-violations');
const topArgIndex = argv.findIndex(a => a === '--top');
let topN = 5;
if (topArgIndex !== -1 && argv[topArgIndex+1]) topN = parseInt(argv[topArgIndex+1], 10) || 5;

if (!fs.existsSync(inputPath)) {
  console.error('File not found:', inputPath);
  process.exit(2);
}

const raw = fs.readFileSync(inputPath, 'utf8');
let json;
try {
  json = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse JSON:', e.message);
  process.exit(3);
}

function short(node) {
  // node.target is an array; join targets
  const target = (node.target || []).slice(0,3).join(', ');
  let html = node.html || '';
  if (html.length > 240) html = html.slice(0,240) + '…';
  return { target, html };
}

const summary = {
  url: json.url || null,
  timestamp: json.timestamp || new Date().toISOString(),
  engine: (json.testEngine && json.testEngine.version) || 'unknown',
  counts: {
    violations: (json.violations || []).length,
    incomplete: (json.incomplete || []).length,
    passes: (json.passes || []).length,
    inapplicable: (json.inapplicable || []).length
  },
  violations: [],
  incomplete: []
};

function gather(list, into, limit) {
  (list || []).forEach(rule => {
    const item = {
      id: rule.id,
      impact: rule.impact,
      help: rule.help,
      helpUrl: rule.helpUrl,
      description: rule.description,
      nodes: (rule.nodes || []).slice(0, limit).map(n => ({ target: n.target, html: (n.html||'').replace(/\s+/g,' ').trim() }))
    };
    into.push(item);
  });
}

gather(json.violations, summary.violations, topN);
gather(json.incomplete, summary.incomplete, topN);

const outBase = path.join(path.dirname(inputPath), path.basename(inputPath, path.extname(inputPath)));
const outJson = outBase + '-summary.json';
const outHtml = outBase + '-summary.html';
fs.writeFileSync(outJson, JSON.stringify(summary, null, 2), 'utf8');

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

let html = `<!doctype html><html><head><meta charset="utf-8"><title>Axe summary for ${esc(summary.url||'report')}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui,Arial,Helvetica;margin:18px;color:#111}h1,h2{margin:0 0 8px}pre{white-space:pre-wrap;background:#fafafa;padding:8px;border-radius:6px;border:1px solid #eee}table{border-collapse:collapse;width:100%;margin-top:8px}td,th{border:1px solid #eee;padding:6px;text-align:left} .badge{display:inline-block;padding:2px 6px;border-radius:4px;background:#f1f5f9;margin-right:6px;font-size:12px}</style>
</head><body>
<h1>Axe Report Summary</h1>
<div><strong>URL:</strong> ${esc(summary.url||'N/A')}</div>
<div><strong>Timestamp:</strong> ${esc(summary.timestamp)}</div>
<div style="margin-top:8px">
  <span class="badge">Violations: ${summary.counts.violations}</span>
  <span class="badge">Incomplete: ${summary.counts.incomplete}</span>
  <span class="badge">Passes: ${summary.counts.passes}</span>
  <span class="badge">Inapplicable: ${summary.counts.inapplicable}</span>
</div>
`;

function renderGroup(title, items) {
  if (!items || !items.length) return `<h2>${esc(title)}: none</h2>`;
  let out = `<h2>${esc(title)}</h2>`;
  items.forEach(rule => {
    out += `<h3>${esc(rule.id)} <small>(${esc(rule.impact||'')})</small></h3>`;
    out += `<div>${esc(rule.help)} - <a href="${esc(rule.helpUrl)}" target="_blank">details</a></div>`;
    out += `<table><thead><tr><th>Target</th><th>HTML snippet</th></tr></thead><tbody>`;
    rule.nodes.forEach(n => {
      out += `<tr><td><pre>${esc(Array.isArray(n.target)?n.target.join('\n'):String(n.target))}</pre></td><td><pre>${esc(n.html||'')}</pre></td></tr>`;
    });
    out += `</tbody></table>`;
  });
  return out;
}

html += renderGroup('Violations (top rules)', summary.violations);
html += renderGroup('Incomplete (top rules)', summary.incomplete);
html += `<hr><div>Full JSON summary: <a href="${path.basename(outJson)}">${path.basename(outJson)}</a></div>`;
html += `</body></html>`;

fs.writeFileSync(outHtml, html, 'utf8');

console.log('Summary written:', outJson, outHtml);
if (failOnViolations && summary.counts.violations > 0) {
  console.error('Failing on violations:', summary.counts.violations);
  process.exit(5);
}
process.exit(0);
