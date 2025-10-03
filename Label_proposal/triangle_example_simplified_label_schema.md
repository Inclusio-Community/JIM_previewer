# Triangle Example — Simplified Label Schema with Print and Braille

This example demonstrates the simplified label schema (Option B: XY + Ref + Offset) applied to a triangle with three edges. Both print and braille labels are shown, but either may be optional or hidden in a viewer if the device provides direct interaction.

---

## Triangle Geometry
Vertices:
- A: (150, 50)
- B: (50, 150)
- C: (250, 150)

Edges (with SVG element ids):
- `#edge-AB`: line from A to B
- `#edge-BC`: line from B to C
- `#edge-CA`: line from C to A

---

## JIM `labels` block

```json
{
  "labels": [
    {
      "id": "lbl-AB",
      "xy": { "x": 100, "y": 100 },
      "ref": { "selector": "#edge-AB", "hint": "edge@t=0.5" },
      "offset": { "dx": 0, "dy": 0, "units": "px" },
      "align": "center",
      "print": { "text": "5", "lang": "en" },
      "braille": { "text": "⠑", "code": "UEB" },
      "label_dom": "#label-AB"
    },
    {
      "id": "lbl-BC",
      "xy": { "x": 150, "y": 160 },
      "ref": { "selector": "#edge-BC", "hint": "edge@t=0.5" },
      "offset": { "dx": 0, "dy": 10, "units": "px" },
      "align": "center",
      "print": { "text": "6", "lang": "en" },
      "braille": { "text": "⠋", "code": "UEB" },
      "label_dom": "#label-BC"
    },
    {
      "id": "lbl-CA",
      "xy": { "x": 200, "y": 100 },
      "ref": { "selector": "#edge-CA", "hint": "edge@t=0.5" },
      "offset": { "dx": 0, "dy": 0, "units": "px" },
      "align": "center",
      "print": { "text": "3", "lang": "en" },
      "braille": { "text": "⠉", "code": "UEB" },
      "label_dom": "#label-CA"
    }
  ]
}
```

---

## Notes
- `xy` is the authoritative draw point.
- `ref` + `offset` are optional but provide context for regeneration if geometry changes.
- `print` and `braille` are both optional; a viewer could choose to hide them depending on device capabilities.
- `align` controls SVG text-anchor.
- `label_dom` ties the JIM entry to a `<text>` node in the SVG, if present.

This keeps runtime rendering trivial (use `xy` directly) while preserving enough metadata for editors or generators to recompute placement if needed.

