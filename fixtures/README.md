# Test Fixtures

This directory contains canonical test fixtures for the JIM Previewer.

## golden.svg

The primary test fixture covering all requirements from `Testing.md`.

### SVG Elements

| ID | Element Type | Visual Style | Purpose |
|----|--------------|--------------|---------|
| `#open-path-svg` | `<path>` (open) | 2px stroke, no fill | SVG-only stroke hit testing (has selector + behavior) |
| `#open-path-overlay` | `<path>` (open) | 2px stroke, no fill | Visual-only element for overlay-enhanced hit testing (no selector) |
| `#closed-shape` | `<polygon>` | 2px stroke + fill | Visual-only element with stroke+fill, edge-only hit via overlay (no selector) |
| `#transformed-rect` | `<rect>` in `<g transform>` | stroke + fill | Hit testing under transforms (has selector for implicit announcement) |
| `#concurrent-target` | `<circle>` | stroke + fill | Haptic + audio concurrency (no selector) |
| `#repeat-target` | `<rect>` | stroke + fill | repeatInterval + repeatIndex testing (no selector) |
| `#selector-set-a` | `<circle>` | stroke + fill | JSONPath selector-set member |
| `#selector-set-b` | `<circle>` | stroke + fill | JSONPath selector-set member |
| `#implicit-name-test` | `<ellipse>` | stroke + fill | Implicit name fallback when explicit omits name |

### JIM Selectors (4 total)

| Selector Key | DOM Target | JSON Binding | Purpose |
|--------------|------------|--------------|---------|
| `targetSet` | `#selector-set-a, #selector-set-b` | `$.datasets[0].series[0].records[0]` | Multi-element selector test |
| `openPathSvg` | `#open-path-svg` | `$.datasets[0].series[0].records[0]` | SVG-only hit test with data binding |
| `transformedRect` | `#transformed-rect` | `$.datasets[0].series[0].records[2]` | Implicit announcement from JSONPath |
| `implicitNameTest` | `#implicit-name-test` | `$.datasets[0].series[0].records[3]` | Explicit description + implicit name fallback |

### Behaviors (10 total)

| # | Target Type | Target | Test Coverage |
|---|-------------|--------|---------------|
| 1 | DOM selector | `#open-path-svg` | SVG-only stroke hit (thin 2px), explicit announcement |
| 2 | Shape overlay | path (20px stroke) | Enhanced hit area over thin visual stroke |
| 3 | Shape overlay | polygon (15px stroke, no fill) | Edge-only hit on filled SVG shape, enter→details→exit |
| 4 | DOM selector | `#transformed-rect` | Transform correctness, implicit announcement |
| 5 | DOM selector | `#selector-set-a, #selector-set-b` | Multi-selector targeting |
| 6 | DOM selector | `#concurrent-target` | Haptic + audio same event, activate event |
| 7 | Shape overlay | line (20px stroke) | Stroke-only overlay exclusivity test |
| 8 | Shape overlay | rect (fill only) | Fill-only overlay exclusivity test, all 3 announcement layers |
| 9 | DOM selector | `#repeat-target` | repeatInterval + repeatIndex |
| 10 | DOM selector | `#implicit-name-test` | Explicit description without name → implicit name fallback |

### Test Case Mapping

| Testing.md Requirement | Behavior # | Notes |
|------------------------|------------|-------|
| Open path stroke-only hit | 1, 2 | #1 SVG-only (2px), #2 overlay-enhanced (20px hit) |
| Closed shape hit testing | 3 | SVG has stroke+fill, overlay is edge-only |
| Fill vs stroke exclusivity | 7, 8 | Stroke-only line vs fill-only rect overlays |
| Transform correctness | 4 | Element in `<g transform>` |
| enter → details → exit | 3 | All three events defined |
| activate independent | 6 | Separate activate block |
| Haptic + audio concurrency | 6 | Both in enter event |
| Announcements at behavior level | All | No announcements in event blocks |
| Implicit name (endpoint) | 4 | From $.datasets[0].series[0].records[2] |
| Implicit name (wildcard) | 5 | Via multi-selector |
| Explicit overrides implicit | 1 | Has explicit + data mapping |
| Explicit omits name → fallback | 10 | Explicit description only, implicit name from data |
| JSONPath selector-set | 5 | Multi-element selector |
| repeatInterval + repeatIndex | 9 | Both properties set |

### Hit Testing Design Patterns

1. **SVG-only hit testing** (`#open-path-svg`): Uses thin 2px stroke with a JIM selector binding. Tests native SVG hit detection with both explicit announcement and data binding.

2. **Overlay-enhanced hit testing** (`#open-path-overlay`): Thin 2px visual stroke with NO selector - only the 20px shape overlay provides interaction. The SVG element is purely visual.

3. **Edge-only hit on filled shape** (`#closed-shape`): SVG shows stroke+fill polygon with NO selector - only the stroke-only overlay (15px, no fill) provides interaction. Interior clicks don't trigger - only edge clicks do.

4. **Stroke vs fill exclusivity** (behaviors 7, 8): Separate overlays test that stroke-only shapes don't trigger on interior, and fill-only shapes don't trigger on stroke area.

### Audio Assets

The concurrent test (behavior 6) references:
- `blop.mp3`

This assumes shared Inclusio audio assets are available.

## Running Tests

1. Open `jim-viewer.html` in a browser
2. Load `fixtures/golden.svg`
3. Verify in the Spec Compliance panel:
   - 0 errors
   - All 10 behaviors detected
   - 4 selectors (no orphans)
4. Interact with each element to verify hit regions and behaviors:
   - `#open-path-svg`: Only triggers on the thin 2px stroke line
   - `#open-path-overlay`: Only triggers via the 20px overlay (NOT the thin SVG stroke)
   - `#closed-shape`: Only triggers on edges via overlay, NOT interior fill
   - `#transformed-rect`: Triggers correctly despite rotation
   - `#concurrent-target`: Shows both haptic and audio
   - `#repeat-target`: Haptic repeats from repeatIndex
   - `#implicit-name-test`: Shows implicit name ("Implicit Name Fallback") with explicit description
