
> **License:** MIT — See [LICENSE](LICENSE) for details.


## About / Project Status

This is a public, open source repository supporting the [JIM (JSON for Interactive Media) specification](https://inclusio-community.github.io/json-image-metadata/). The JIM Metadata Viewer is designed for developers, researchers, and accessibility advocates working with SVG graphics and JIM metadata. It provides robust validation, accessibility inspection, and interactive visualization for JIM-enabled and standard SVG files.

# JIM Metadata Viewer

An interactive tool for analyzing and validating JSON for Interactive Media (JIM) metadata embedded in SVG files. Also functions as a comprehensive SVG accessibility inspector.

## Features

- **Robust JIM Validation**: Preflight normalization, error/warning reporting, and spec compliance checks for JIM metadata
- **SVG Accessibility Audit**: Analyzes ARIA, roles, labels, keyboard navigation, and accessibility attributes
- **Interactive Visualization**: Click or focus SVG elements to inspect JIM mappings, behaviors, and accessibility info
- **Selector List Panel**: Displays all JIM selectors and visually indicates which are mapped by behaviors (including wildcards and compound selectors)
- **Detailed Analysis Panel**: Shows validation results, orphaned selectors, facet coverage, and a categorized inventory of SVG elements
- **Advanced Selector Support**: Handles wildcards, descendant, and compound CSS selectors in behavior mapping
- **Screen Reader & Keyboard Accessibility**: Includes skip links, live regions, and focus management for accessible navigation
- **SVG & HTML File Support**: Works with both SVG and HTML files containing SVG elements
- **SVG-Only Mode**: Provides accessibility audit and inventory for regular SVG files without JIM metadata
- **Comprehensive Error/Warning Reporting**: Surfaces invalid selectors, behaviors, and metadata structure issues
- **Example Files Included**: Ready-to-use SVGs for testing and demonstration

## Quick Start

1. Open `jim-viewer.html` in your browser, or visit the [JIM Viewer webapp](https://inclusio-community.github.io/JIM_previewer/jim-viewer.html)
2. Upload an SVG file (with or without JIM metadata)
3. Click elements in the visualization to inspect their properties
4. Review validation results and accessibility recommendations

## Files

- `jim-viewer.html`: Interactive HTML viewer for SVGs with JIM metadata
- `examples/`: Example SVG files for testing and demonstration:
	- `triangle-complete-with-jim-metadata.svg`
	- `testimage_0.svg`, `testimage_1.svg`, `testimage_2.svg`, `testimage_3.svg`, `testimage_4.svg`
	- `Division_of_energy_in_the_Universe.svg`
	- `College_enrollment_in_public_and_private_institutions_in_the_U_S__1965_to_2028.svg`
	- `Distribution_of_the_workforce_across_economic_sectors_in_India_2019.svg`
	- `Number_of_Xbox_Live_MAU_Q1_2016___Q4_2019.svg`
	- `Unemployment_rate_in_Greece_1999_2019.svg`

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

## Contributors & Credits

- Example SVGs provided by Dan Gardner, UNAR (testimages), and Fizz Studio with Paracharts (chart examples).
- Contributions, feedback, and new example files are welcome! Please open an issue or pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
