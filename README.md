
> **License:** MIT — See [LICENSE](LICENSE) for details.


## About / Project Status

This is a public, open source repository supporting the [JIM (JSON for Interactive Media) specification](https://inclusio-community.github.io/json-image-metadata/). The JIM Metadata Viewer is designed for developers, researchers, and accessibility advocates working with SVG graphics and JIM metadata. It provides robust validation, accessibility inspection, and interactive visualization for JIM-enabled and standard SVG files.

# JIM Metadata Viewer

An interactive tool for analyzing and validating JSON for Interactive Media (JIM) metadata embedded in SVG files. Also functions as a comprehensive SVG accessibility inspector.

## Features

- **Robust JIM Validation**: Preflight normalization, error/warning reporting, and spec compliance checks for JIM metadata. Supports both [root and enveloped JIM forms](https://inclusio-community.github.io/json-image-metadata/#jim_structure_forms).
- **SVG Accessibility Audit**: Analyzes ARIA, roles, labels, keyboard navigation, and accessibility attributes
- **Interactive Visualization**: Click or focus SVG elements to inspect JIM mappings, behaviors, and accessibility info
- **Shape behavior overlays**: Renders shapes declared by JIM behavior payloads (rect, circle, ellipse, line, polygon, polyline, path) as focusable, keyboard-accessible overlays. Overlays respect author-provided style hints (stroke, fill, stroke-width, opacity), can be toggled with the Show/Hide overlays control, and are surfaced in the Selectors / Inventory panels as "Shape Behaviors" for quick inspection.
- **Selector List Panel**: Displays all JIM selectors and visually indicates which are mapped by behaviors (including wildcards and compound selectors)
- **Detailed Analysis Panel**: Shows validation results, orphaned selectors, facet coverage, and a categorized inventory of SVG elements
- **Advanced Selector Support**: Handles wildcards, descendant, and compound CSS selectors in behavior mapping
- **Screen Reader & Keyboard Accessibility**: Includes skip links, live regions, and focus management for accessible navigation
- **SVG & HTML File Support**: Works with both SVG and HTML files containing SVG elements
- **SVG-Only Mode**: Provides accessibility audit and inventory for regular SVG files without JIM metadata
- **Comprehensive Error/Warning Reporting**: Surfaces invalid selectors, behaviors, and metadata structure issues
- **Built-in Example Loader**: Load example SVGs directly from a categorized dropdown — no download required
- **Example Files Included**: Ready-to-use SVGs for testing and demonstration

## Quick Start

1. Open `jim-viewer.html` in your browser, or visit the [JIM Viewer webapp](https://inclusio-community.github.io/JIM_previewer/jim-viewer.html)
2. Upload an SVG file, or select one from the **"Load an example"** dropdown
3. Click elements in the visualization to inspect their properties
4. Review validation results and accessibility recommendations

You can also link directly to an example:
`https://inclusio-community.github.io/JIM_previewer/jim-viewer.html?example=examples/E001-Vertical_Bar_Chart.svg`

## Files

- `jim-viewer.html`: Interactive HTML viewer for SVGs with JIM metadata
- `tests/auto-load.html`: Test harness that loads all examples files and allows AXE testing, also used by axe-playwright.yml with a subset of tests for pull requests
- `fixtures/`: Test fixtures for unit/regression testing (see [fixtures/README.md](fixtures/README.md))
	- `golden.svg`: Canonical test fixture covering all Testing.md requirements
- `examples/`: Example SVG files for testing and demonstration:
	- `E001-Vertical_Bar_Chart.svg` through `E006-Plant_Cell_Structure-experimental.svg`
	- `triangle-complete-with-jim-metadata.svg`, `simple_svg_triangle.svg`, `right_triangle.svg`
	- `testimage_0.svg` through `testimage_4.svg`
	- `bar-chart-metadata-jsonpath.svg`, `oregon-custom-projection.svg`
	- Statistical charts (College enrollment, Xbox Live, Unemployment, Workforce, Energy)
	- Educational diagrams (Photosynthesis, US Midwest Map)

## Running accessibility checks

See `CI.md` for details on the small CI/test helpers. In short:

- The repository runs `html-validate` and a pa11y smoke test in CI.
- You can run an axe-core smoke test locally across the example SVGs with Playwright using the `scripts/ci-run-axe.js` helper. See `CI.md` for commands and notes.

## Use Cases

- Validate JIM metadata during development
- Debug JIM selector mappings
- Audit SVG accessibility compliance
- Inspect element properties and computed styles

## Purpose

This project demonstrates how to preview, validate, and inspect SVG files that include JIM metadata, useful for development and testing of JIM-enabled graphics and accessibility.

## What's new (feat/centralize-styles)

- Selector panel & SVG inventory parity: selectors now render with a semantic H2 heading and selector buttons follow the same accessible pattern as SVG inventory items.
- Group behaviors: selectors that match multiple elements are surfaced under "Group Behaviors" with a keyboard-focusable group button and member preview buttons.
- Accessibility improvements:
	- Decorative icons/emoji are marked aria-hidden and readable labels are provided via sr-only text where appropriate.
	- Inventory and selector buttons are reachable via keyboard (Enter/Space activates them).
	- Info panels update an aria-live region for screen-reader announcements.
- Robust selector handling: selectors that do not match any DOM element are skipped during rendering (avoids TypeError).
- Inventory extended: "Other Elements" category now includes basic SVG shapes (polygon, rect, circle, ellipse, line, polyline, path).
- Dev tokens & styles consolidated: color tokens and repeated inline styles were centralized to improve contrast and make future CSS refactors easier.
- Viewer improvements: behavior-target overlays are now rendered and toggleable, selector-to-behavior mapping is more tolerant of legacy and group selectors (e.g., class and comma-separated selectors), and inventory/validation now surface behaviors that target DOM elements even when no declared selector entry exists.
- Validation tracking: validateJIMStructure() now includes invalidJsonPaths: [] in the returned results and populates it for any selector whose JSON path resolves to null or an empty array. UI rendering: renderValidationResults() now renders an "Invalid JSON Paths" section listing each failing selector key, its dom and the problematic json path with a short explanatory note.

## Contributors & Credits

- Example SVGs provided by Dan Gardner, UNAR (testimages), and Fizz Studio with Paracharts (chart examples).
- Contributions, feedback, and new example files are welcome! Please open an issue or pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
