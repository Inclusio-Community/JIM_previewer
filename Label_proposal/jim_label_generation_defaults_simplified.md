# JIM Label Generation Defaults — 11‑Step Guide

This guide captures the recommended generation‑time defaults for labels in SVG+JIM so that labels render consistently and require minimal manual adjustment.

---

## 1. Data Model (JIM `labels` block)

Each label entry should minimally contain:

```json
{
  "id": "lbl-AB",
  "targets": [{ "selector": "#edge-AB" }],
  "anchor": { "type": "edge", "index": 0, "t": 0.5 },
  "offset": { "dx": 0, "dy": 0, "units": "px" },
  "align": "center",
  "print": { "text": "AB", "lang": "en" },
  "braille": { "text": "⠁⠃", "code": "UEB" },
  "label_dom": "#text-label-AB"
}
```

Required: `id`, `targets`, `anchor`, `offset`. Both `print` and `braille` are optional, and may be hidden or suppressed in a viewer if the interactive device can handle the sub‑object behaviors directly.

---

## 2. SVG Materialization

Always create an actual `<text>` node in the SVG:

```svg
<text id="text-label-AB" x="100" y="100"
      text-anchor="middle" dominant-baseline="middle"
      class="lbl">AB</text>
```

This ensures non‑JIM consumers see the labels.

---

## 3. ID and Selector Conventions

- Geometry IDs: `geom-<role>-<index>` (e.g., `geom-edge-02`).
- Label IDs: `lbl-<role>-<index>` (e.g., `lbl-vertex-A`).
- Prefer `#id` selectors in JIM.

---

## 4. Placement Heuristics

Use consistent rules based on geometry type:

- **Line/Edge**: midpoint + outward normal * margin.
- **Polygon**: centroid (or fallback point).
- **Circle**: centroid or circumference offset.
- **Rectangle**: centroid for name; edge midpoints for sides.
- **Bar**: top midpoint.
- **Scatter point**: offset NE.
- **Pie slice**: mid‑angle, radial offset.

---

## 5. Collision Avoidance (First Pass)

1. Build bounding boxes for placed labels.
2. If overlap:
   - Flip normal.
   - Try tangent offset.
   - Spiral offset (incrementally).
3. If unresolved, enable a short leader line.

---

## 6. Typography Defaults

- Print labels: `font-family: system-ui, Arial, sans-serif; font-size: 12px;`
- Braille labels: store in JIM (`braille.text`); render visually only if needed. If rendered, use a braille font sized for tactile readability (e.g., 29pt Braille29 or device-specific defaults).
- Use CSS classes for theme control.

---

## 7. Transforms & Coordinate Space

- Bake transforms into coordinates before computing anchors.
- Store offsets in screen px at authoring scale.
- If not baked, add `meta.coordinateSpace: "local"|"screen"`.

---

## 8. Accessibility Scaffolding

- Add `<title>` for each labeled geometry.
- Link geometry to its label via `aria-labelledby`.
- Add a `<desc>` summarizing the graphic.
- Use language codes on text content to support screen readers.

---

## 9. Units & Measurements (Optional)

Include real‑world values when known:

```json
"units": { "display": "cm", "px_per_unit": 37.8, "value": 5.0 }
```

---

## 10. Defaults Table (Quick Reference)

| Geometry      | Anchor                    | Offset           | Align  | Leader |
| ------------- | ------------------------- | ---------------- | ------ | ------ |
| Line/Edge     | midpoint                  | normal * margin  | center | false  |
| Polygon       | centroid                  | (0,0) or (0,−M)  | center | false  |
| Circle        | centroid or circumference | radial offset    | center | false  |
| Rectangle     | centroid                  | (0,0)            | center | false  |
| Bar           | top midpoint              | (0,−M)           | center | false  |
| Scatter point | point                     | (+M,−M)          | start  | false  |
| Pie slice     | mid‑angle                 | radial offset    | start  | auto   |

---

## 11. Generation QA checklist

- All targets have stable ids.
- JIM labels include `anchor` and `offset` (even if 0,0).
- Both `print` and `braille` fields optional but supported.
- SVG `<text>` exists for visible labels; `text-anchor`/`dominant-baseline` set.
- No transforms left unbaked (or note coordinate space).
- First-pass collision avoidance applied; leaders toggled when needed.
- `<title>` per labeled geometry; document `<desc>` present.
- Language codes on `print.lang`; braille `code` populated if known.
- Units provided where applicable.

---

**Summary.** By emitting anchors, offsets, and alignment at generation time, most labels will be correct by default. Human editors can then only adjust edge cases instead of fixing everything.

