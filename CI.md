# CI / Local Validation Guide

This project includes lightweight continuous-integration checks for HTML validity and accessibility. This document explains how to run them locally and how CI runs them in GitHub Actions.

## What runs in CI

- `html-validate` to lint `jim-viewer.html` and other HTML files.
- `pa11y` (a11y smoke test) against a small test harness that auto-loads an example SVG: `tests/auto-load.html`.

The CI workflow file is at `.github/workflows/html-validate.yml`.

## Run locally (PowerShell)

1. Install dev dependencies:

If this repository does not have a lockfile (package-lock.json), use `npm install` instead of `npm ci`.

```powershell
# If package-lock.json exists:
npm ci
# Otherwise (or on first-time setup):
npm install
```

2. Run the HTML linter:

```powershell
npm run lint:html
```

3. Start a static server and run pa11y (option A: separate terminals)

Terminal A:

```powershell
npx http-server -p 5501
```

Terminal B:

```powershell
npx pa11y http://127.0.0.1:5501/tests/auto-load.html
```

4. Or use a single PowerShell session (background job):

```powershell
$cwd = (Get-Location).Path
$job = Start-Job -ScriptBlock { param($p) Set-Location $p; npx http-server -p 5501 } -ArgumentList $cwd
Start-Sleep -Seconds 1
npx pa11y http://127.0.0.1:5501/tests/auto-load.html
Stop-Job $job
Remove-Job $job
```

Notes

- If port 5500 is already in use (VS Code Live Server commonly uses 5500), use port 5501 as shown above.
- The test harness at `tests/auto-load.html` instructs the viewer to load `examples/testimage_0.svg`. You can change the example by editing the harness or opening `jim-viewer.html` directly and using the file upload control.
- The project includes `.pa11yci` and `.htmlvalidate.json` with conservative defaults to reduce noisy CI failures; change them if you need stricter or looser rules.

If you'd like, I can add a GitHub Action step that uploads pa11y output when the job fails to make debugging PR failures easier.

## Running axe-core locally (examples smoke tests)

We added a small helper script that runs axe-core against each example via Playwright. This is useful as an early smoke test to ensure example SVGs don't introduce accessibility violations.

Prerequisites:

- Install project devDependencies and Playwright browsers. If you don't have a lockfile, use `npm install`.

```powershell
# If package-lock.json exists:
npm ci
# Otherwise:
npm install
npx playwright install --with-deps
```

Run the smoke test (assumes a static server is serving the repo on port 8080):

Terminal A — start a simple server:

```powershell
npx http-server -p 8080
```

Terminal B — run the axe smoke runner (writes per-example JSON into `axe-output/`):

```powershell
node scripts/ci-run-axe.js --base-url=http://127.0.0.1:8080 --out-dir=axe-output --fail-on-violations=true
```

Notes:

- The script will create an `axe-output/` directory with one JSON file per example (e.g. `axe-testimage_0.svg.json`). Those artifacts are ignored by `.gitignore`.
- If you prefer the npm shortcut (after installing Playwright):

```powershell
npm run ci:axe
```
