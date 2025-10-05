# Contributing

Thanks for your interest in contributing to the JIM Metadata Viewer! A few quick guidelines to make contributions easier to review and land.

## Before you open a PR

- Run the HTML linter locally:

```powershell
npm ci
npm run lint:html
```

- Run the accessibility smoke test (recommended) using the test harness:

```powershell
# start a local server (port 5501 recommended)
npx http-server -p 5501
# in another terminal
npx pa11y http://127.0.0.1:5501/tests/auto-load.html
```

### Axe smoke tests (optional)

If you'd like to run a lightweight axe smoke test across the example SVGs, install Playwright and run the helper script:

```powershell
# install dev deps and playwright browsers
npm ci
npx playwright install --with-deps

# start a local server (port 8080 recommended)
npx http-server -p 8080

# run the axe smoke tests (writes outputs to axe-output/)
node scripts/ci-run-axe.js --base-url=http://127.0.0.1:8080 --out-dir=axe-output --fail-on-violations=true
```

The `axe-output/` directory is ignored by `.gitignore` and contains one JSON artifact per example.

- See `CI.md` for additional guidance on running checks locally and avoiding common CI issues.

## PR checklist

- [ ] Code compiles and lints (`npm run lint:html`)
- [ ] New features include accessible markup and keyboard interactions
- [ ] Add or update tests/examples where relevant
- [ ] Update `README.md` or `CI.md` if the change affects developer workflows

Thanks — contributions are welcome! If you need help reproducing CI locally, open an issue or drop a note in the PR description.