// Auto-load harness script extracted from tests/auto-load.html
// Keeps listeners attached immediately and performs async work in background.
(function () {
  'use strict';

  const defaultExamples = [
    '/fixtures/golden.svg',
    '/fixtures/enveloped-earcon.svg',
    '/examples/testimage_0.svg',
    '/examples/simple_svg_triangle.svg',
    '/examples/triangle-complete-with-jim-metadata.svg',
    '/examples/triangle-with-orphan-selectors.svg',
    '/examples/Division_of_energy_in_the_Universe.svg'
  ];

  async function parseExamplesFromQueryOrDirectory() {
    try {
      const params = new URLSearchParams(window.location.search);
      const ex = params.get('examples');
      if (ex) return ex.split(',').map(s => s.trim()).filter(Boolean).map(p => p.startsWith('/') ? p : '/' + p);
    } catch (e) { /* ignore */ }

    try {
      const res = await fetch('/examples/');
      if (!res || !res.ok) return defaultExamples.slice();
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      let links = Array.from(doc.querySelectorAll('a'))
        .map(a => a.getAttribute('href'))
        .filter(Boolean)
        .filter(h => h.toLowerCase().endsWith('.svg'))
        .map(h => h.startsWith('/') ? h : ('/examples/' + h.replace(/^\.\//, '')));
      if (links.length) return links;
      // fallback regex
      const regex = /([\w\-\. \(\)]+?\.svg)/gi;
      const matches = Array.from(text.matchAll(regex)).map(m => m[1]);
      if (matches.length) {
        links = matches.map(h => h.startsWith('/') ? h : ('/examples/' + h.replace(/^\.\//, '')));
        const seen = new Set();
        return links.filter(p => seen.has(p) ? false : (seen.add(p), true));
      }
    } catch (e) { /* ignore network/parse issues */ }
    return defaultExamples.slice();
  }

  // State and elements
  let examples = defaultExamples.slice();
  let idx = 0;
  const iframe = document.getElementById('viewer');
  const currentLabel = document.getElementById('current');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const inspectBtn = document.getElementById('inspect-btn');
  const inspectInput = document.getElementById('inspect-input');
  const runAxeBtn = document.getElementById('run-axe');
  const controls = document.getElementById('controls');
  const controlsToggle = document.getElementById('controls-toggle');

  // Collapse/expand behavior for the control panel (persisted in localStorage)
  function setControlsCollapsed(collapsed) {
    if (!controls) return;
    controls.classList.toggle('collapsed', !!collapsed);
    try { localStorage.setItem('autoLoadControlsCollapsed', !!collapsed ? '1' : '0'); } catch (e) { /* ignore */ }
    try { if (controlsToggle) controlsToggle.setAttribute('aria-expanded', (!!collapsed ? 'false' : 'true')); } catch (e) { /* ignore */ }
  }
  // update layout to account for control bar height so iframe remains sized correctly
  function updateControlHeightVar() {
    try {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      const expanded = !controls.classList.contains('collapsed');
      const h = expanded ? styles.getPropertyValue('--control-height').trim() : styles.getPropertyValue('--control-collapsed-height').trim();
      // set padding-top and iframe height implicitly handled by CSS variables; if we need to force, set body padding
      root.style.setProperty('--active-control-height', h || '56px');
      document.body.style.paddingTop = h || '56px';
      if (iframe) iframe.style.height = `calc(100vh - ${h || '56px'})`;
    } catch (e) { /* ignore */ }
  }
  // call after state changes
  const originalSetControlsCollapsed = setControlsCollapsed;
  setControlsCollapsed = function (collapsed) {
    originalSetControlsCollapsed(collapsed);
    updateControlHeightVar();
  };
  // ensure layout is correct initially
  updateControlHeightVar();
  if (controlsToggle) {
    controlsToggle.addEventListener('click', () => {
      const isCollapsed = controls && controls.classList.contains('collapsed');
      setControlsCollapsed(!isCollapsed);
    });
  }
  // apply saved state
  try {
    const saved = localStorage.getItem('autoLoadControlsCollapsed');
    if (saved === '1') setControlsCollapsed(true);
  } catch (e) { /* ignore */ }

  function updateUi() {
    if (currentLabel) currentLabel.textContent = `${idx+1} / ${examples.length}`;
    const path = examples[idx];
    if (iframe && path) iframe.src = `/jim-viewer.html?example=${encodeURIComponent(path.replace(/^\//, ''))}`;
  }

  function postLoad() {
    const path = examples[idx];
    try { iframe.contentWindow.postMessage({ type: 'autoLoadExample', path }, location.origin); } catch (e) { /* ignore */ }
  }

  // Attach listeners immediately (non-blocking)
  if (iframe) {
    iframe.addEventListener('load', () => {
      postLoad();
      try {
        const params = new URLSearchParams(window.location.search);
        const inspectParam = params.get('inspect');
        const autorun = params.get('autorun');
        if (inspectParam) {
          try { iframe.contentWindow.postMessage({ type: 'inspect', selector: inspectParam }, location.origin); } catch (e) {}
        }
        if (autorun === '1' || autorun === 'true') {
          setTimeout(() => { if (runAxeBtn) runAxeBtn.click(); }, 400);
        }
      } catch (e) { /* ignore */ }
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { if (!examples || !examples.length) return; idx = (idx - 1 + examples.length) % examples.length; updateUi(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { if (!examples || !examples.length) return; idx = (idx + 1) % examples.length; updateUi(); });
  if (inspectBtn) inspectBtn.addEventListener('click', () => { const val = inspectInput && inspectInput.value && inspectInput.value.trim(); if (!val) return; try { iframe.contentWindow.postMessage({ type: 'inspect', selector: val }, location.origin); } catch (e) { console.warn('postMessage inspect failed', e); } });

  // Prepare results panel (single instance)
  let resultsWrap = document.getElementById('axe-results-wrap');
  if (!resultsWrap) {
    resultsWrap = document.createElement('div');
    resultsWrap.id = 'axe-results-wrap';
    resultsWrap.className = 'axe-results';
    // start hidden until an axe run is started to avoid showing an empty box on autoload
    resultsWrap.style.display = 'none';
    const header = document.createElement('div'); header.className = 'results-header';
    const title = document.createElement('div'); title.className = 'results-title'; title.textContent = 'axe results';
    const closeBtn = document.createElement('button'); closeBtn.type = 'button'; closeBtn.setAttribute('aria-label', 'Close axe results'); closeBtn.className = 'close-btn'; closeBtn.textContent = '×'; closeBtn.addEventListener('click', () => { resultsWrap.style.display = 'none'; });
    header.appendChild(title); header.appendChild(closeBtn); resultsWrap.appendChild(header);
    const resultsPanel = document.createElement('pre'); resultsPanel.id = 'axe-results-pre'; resultsWrap.appendChild(resultsPanel); document.body.appendChild(resultsWrap);
  }
  const resultsPanel = document.getElementById('axe-results-pre');

  // Async init: fetch examples list in background
  (async () => {
    try {
      const found = await parseExamplesFromQueryOrDirectory();
      if (Array.isArray(found) && found.length) { examples = found; idx = 0; }
    } catch (e) { console.warn('[auto-load] failed to fetch examples list, using defaults'); }
    updateUi();
  })();

  // Axe runner implementation
  if (runAxeBtn) {
    runAxeBtn.addEventListener('click', async () => {
      if (!resultsPanel) return;
      // reveal the results panel when a run starts
      if (resultsWrap) resultsWrap.style.display = '';
      resultsPanel.textContent = 'Running axe...';
      try {
        const cwin = iframe.contentWindow;
        if (!cwin) throw new Error('iframe window not available');
        if (!cwin.axe) {
          const script = cwin.document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.4/axe.min.js';
          cwin.document.head.appendChild(script);
          await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; setTimeout(resolve, 3000); });
        }
        const includeSVG = document.getElementById('include-svg') && document.getElementById('include-svg').checked;
        const cdoc = cwin.document;
        // Build a list of elements we'll hide during the scan (so axe won't evaluate them).
        // Prefer hiding the visualization container (#visualization) when present; fall back
        // to common container classes or any inline <svg> elements.
        const toHide = [];
        try {
          if (!includeSVG) {
            // Common host container inside the viewer that holds the injected SVG
            const vizContainer = cdoc.getElementById('visualization') || cdoc.querySelector('.viewer-section') || cdoc.querySelector('.visualization');
            if (vizContainer) {
              toHide.push(vizContainer);
            } else {
              // fallback: hide any inline SVG elements found in the iframe
              const svgEls = Array.from(cdoc.querySelectorAll('svg'));
              svgEls.forEach(s => toHide.push(s));
            }
          }
          const dialogEl = cdoc.querySelector('[role="dialog"], .dialog, #dialog, .prev-next, #prev-next');
          if (dialogEl) toHide.push(dialogEl);
        } catch (e) { /* ignore DOM query errors */ }

        // Temporarily hide discovered elements (store previous inline style to restore later)
        const prevStyles = [];
        try {
          toHide.forEach(el => {
            try {
              prevStyles.push({ el, style: el.getAttribute('style') });
              // hide visually and from layout; use important to override inline/style sheet rules
              el.style.setProperty('display', 'none', 'important');
              // also set aria-hidden for SRs
              el.setAttribute('aria-hidden', 'true');
            } catch (e) { /* ignore per-element failures */ }
          });

          // Run axe on the iframe document (now with excluded elements hidden)
          const result = await cwin.axe.run(cdoc);
          // pass result out of try/finally by returning it or assigning to outer scope variable
          var axeResult = result;
        } finally {
          // Restore previous styles/attributes
          prevStyles.forEach(({ el, style }) => {
            try {
              if (style !== null) el.setAttribute('style', style);
              else el.removeAttribute('style');
              // remove aria-hidden only if it was added by us (best-effort)
              if (el.getAttribute('aria-hidden') === 'true') el.removeAttribute('aria-hidden');
            } catch (e) { /* ignore restore errors */ }
          });
        }
        const result = axeResult;

        // compact summary
        const makeSummary = (res) => {
          const counts = { violations: (res.violations||[]).length, incomplete: (res.incomplete||[]).length, passes: (res.passes||[]).length, inapplicable: (res.inapplicable||[]).length };
          const pickNodes = (arr, n=5) => (arr||[]).slice(0,n).map(rule => ({ id: rule.id, impact: rule.impact, help: rule.help, helpUrl: rule.helpUrl, nodes: (rule.nodes||[]).slice(0,3).map(x => ({ target: x.target, html: (x.html||'').replace(/\s+/g,' ').trim() })) }));
          return { url: res.url || null, timestamp: res.timestamp || new Date().toISOString(), engine: (res.testEngine && res.testEngine.version) || null, counts, topViolations: pickNodes(res.violations, 6), topIncomplete: pickNodes(res.incomplete, 6), includeSVG: includeSVG };
        };

        const summary = makeSummary(result);
        resultsPanel.textContent = '';
        const header = document.createElement('div'); header.innerHTML = `<div style="margin-bottom:6px"><strong>axe summary</strong> - Violations: ${summary.counts.violations}, Incomplete: ${summary.counts.incomplete}, Passes: ${summary.counts.passes}</div>`; resultsPanel.appendChild(header);

        const renderGroup = (title, items) => {
          const wrap = document.createElement('div'); const h = document.createElement('div'); h.style.fontWeight = '600'; h.style.marginTop = '8px'; h.textContent = title; wrap.appendChild(h);
          if (!items || !items.length) { const none = document.createElement('div'); none.textContent = 'none'; none.style.color = '#666'; wrap.appendChild(none); return wrap; }
          items.forEach(rule => {
            const r = document.createElement('div'); r.style.marginTop = '6px'; r.innerHTML = `<div><strong>${rule.id}</strong> <small>${rule.impact || ''}</small></div><div style="font-size:12px;color:#333">${rule.help} <a href="${rule.helpUrl}" target="_blank">details</a></div>`;
            const ul = document.createElement('div');
            rule.nodes.forEach(n => {
              const node = document.createElement('div'); node.style.fontSize = '12px'; node.style.marginTop = '4px';
              const t = document.createElement('pre'); t.style.whiteSpace = 'pre-wrap'; t.style.background = '#fafafa'; t.style.padding = '6px'; t.style.borderRadius = '4px'; t.style.border = '1px solid #eee'; t.textContent = Array.isArray(n.target) ? n.target.join('\n') : String(n.target);
              const htm = document.createElement('div'); htm.style.marginTop = '4px'; htm.style.fontSize = '12px'; htm.textContent = n.html;
              node.appendChild(t); node.appendChild(htm); ul.appendChild(node);
            });
            r.appendChild(ul); wrap.appendChild(r);
          });
          return wrap;
        };

        resultsPanel.appendChild(renderGroup('Violations (top)', summary.topViolations));
        resultsPanel.appendChild(renderGroup('Incomplete (top)', summary.topIncomplete));

        // downloads
        try {
          const fullBlob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
          const fullUrl = URL.createObjectURL(fullBlob);
          const fullA = document.createElement('a'); fullA.href = fullUrl; fullA.download = 'axe-output.json'; fullA.textContent = 'Download full axe JSON'; fullA.style.display = 'inline-block'; fullA.style.marginTop = '8px'; resultsPanel.appendChild(fullA);

          const sumBlob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
          const sumUrl = URL.createObjectURL(sumBlob);
          const sumA = document.createElement('a'); sumA.href = sumUrl; sumA.download = 'axe-output-summary.json'; sumA.textContent = 'Download summary JSON'; sumA.style.display = 'inline-block'; sumA.style.marginLeft = '12px'; resultsPanel.appendChild(sumA);

          const makeHtml = (s) => {
            const esc = (x) => String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            let html = '<!doctype html><html><head><meta charset="utf-8"><title>Axe summary</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,Arial;margin:18px;color:#111}h1,h2{margin:0 0 8px}pre{white-space:pre-wrap;background:#fafafa;padding:8px;border-radius:6px;border:1px solid #eee} .badge{display:inline-block;padding:2px 6px;border-radius:4px;background:#f1f5f9;margin-right:6px;font-size:12px}</style></head><body>';
            html += `<h1>Axe summary</h1><div><strong>URL:</strong> ${esc(s.url||'N/A')}</div><div><strong>Timestamp:</strong> ${esc(s.timestamp)}</div>`;
            html += `<div style="margin-top:8px"><span class="badge">Violations: ${s.counts.violations}</span><span class="badge">Incomplete: ${s.counts.incomplete}</span><span class="badge">Passes: ${s.counts.passes}</span></div>`;
            const render = (title, items) => {
              html += `<h2>${esc(title)}</h2>`;
              if (!items || !items.length) { html += `<div style="color:#666">none</div>`; return; }
              items.forEach(r => {
                html += `<h3>${esc(r.id)} <small>${esc(r.impact||'')}</small></h3><div>${esc(r.help)} - <a href="${esc(r.helpUrl)}">details</a></div>`;
                r.nodes.forEach(n => { html += `<pre>${esc(Array.isArray(n.target)?n.target.join('\n'):String(n.target))}</pre><div style="font-size:12px">${esc(n.html)}</div>`; });
              });
            };
            render('Violations (top)', s.topViolations);
            render('Incomplete (top)', s.topIncomplete);
            html += '</body></html>';
            return html;
          };

          const htmlBlob = new Blob([makeHtml(summary)], { type: 'text/html' });
          const htmlUrl = URL.createObjectURL(htmlBlob);
          const openBtn = document.createElement('a'); openBtn.href = htmlUrl; openBtn.target = '_blank'; openBtn.textContent = 'Open summary report (HTML)'; openBtn.style.display = 'inline-block'; openBtn.style.marginLeft = '12px'; resultsPanel.appendChild(openBtn);
        } catch (e) { /* ignore download errors */ }

      } catch (err) {
        resultsPanel.textContent = 'Error running axe: ' + (err && err.message ? err.message : String(err));
      }
    });
  } else {
    console.warn('run-axe button not found; axe runner disabled');
  }

})();
