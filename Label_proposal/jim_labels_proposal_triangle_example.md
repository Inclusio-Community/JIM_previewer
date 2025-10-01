# JIM Labels (Proposal) — Triangle Example

**Purpose.** Add a small, optional `labels` block to JIM so label placement is interoperable and round‑trippable (anchor + offset + alignment), while keeping today’s SVG grouping compatible.

This proposal is **backward‑compatible**: renderers and tools that don’t understand `labels` can ignore it; authors can still materialize visible `<text>` in SVG.

---

## Minimal extension (top‑level `labels`)

```json
{
  "labels": [
    {
      "id": "string",                     // stable label id
      "targets": [{ "selector": "#id" }], // usually a simple #id
      "anchor": {                          // where the label attaches
        "type": "edge" | "vertex" | "centroid" | "path" | "point",
        "index": 0,                        // for edge/vertex
        "t": 0.5,                          // optional param along an edge (0..1)
        "s": 0.5,                          // optional param along a path by length (0..1)
        "x": 0, "y": 0                   // for point anchors
      },
      "offset": { "dx": 0, "dy": 0, "units": "px" },  // placement tweak relative to anchor
      "align": "start" | "center" | "end",              // text alignment intent
      "leader": { "enabled": false, "style": "straight" }, // optional
      "pinned": false,                                    // optional: prevent auto-relayout
      "print":  { "text": "AB", "lang": "en" },       // optional visible/ink text
      "braille":{ "text": "⠁⠃", "code": "UEB" },   // optional device-facing text
      "label_dom": "#text-label-AB"                      // optional link to SVG <text>
    }
  ]
}
```

Notes:
- **Only `targets`, `anchor`, and `offset` are required** for placement; other fields are optional conveniences.
- `selector` should prefer `#id` of the geometric element.

---

## Authoring guidance (generation‑time defaults)

When generating SVG+JIM, emit:

1) **Stable IDs** for target geometry (`#edge-AB`, `#vertex-A`, etc.).
2) **Materialized SVG `<text>`** for visible labels (so non‑JIM consumers see them):

```svg
<text id="text-label-AB" x="100" y="100"
      text-anchor="middle" dominant-baseline="middle"
      class="lbl lbl-default">5</text>
```

3) A `labels` entry with **anchor** + **offset** that explains *how* the above text was placed.

---

## Concrete example (this triangle)

Triangle vertices (from the SVG):
- **A** (150, 50), **B** (50, 150), **C** (250, 150)

SVG already includes edge paths and visible labels:
- `#edge-AB` with `<text id="label-AB" x="100" y="100">5</text>`
- `#edge-BC` with `<text id="label-BC" x="150" y="160">6</text>`
- `#edge-CA` with `<text id="label-CA" x="200" y="100">3</text>`

From geometry midpoints:
- **AB** midpoint → (100, 100) ⇒ label at (100, 100) ⇒ **offset (0, 0)**
- **BC** midpoint → (150, 150) ⇒ label at (150, 160) ⇒ **offset (0, +10)**
- **CA** midpoint → (200, 100) ⇒ label at (200, 100) ⇒ **offset (0, 0)**

### JIM `labels` block for the triangle

```json
{
  "labels": [
    {
      "id": "lbl-AB",
      "targets": [{ "selector": "#edge-AB" }],
      "anchor": { "type": "edge", "index": 0, "t": 0.5 },
      "offset": { "dx": 0, "dy": 0, "units": "px" },
      "align": "center",
      "print": { "text": "5", "lang": "en" },
      "label_dom": "#label-AB"
    },
    {
      "id": "lbl-BC",
      "targets": [{ "selector": "#edge-BC" }],
      "anchor": { "type": "edge", "index": 0, "t": 0.5 },
      "offset": { "dx": 0, "dy": 10, "units": "px" },
      "align": "center",
      "print": { "text": "6", "lang": "en" },
      "label_dom": "#label-BC"
    },
    {
      "id": "lbl-CA",
      "targets": [{ "selector": "#edge-CA" }],
      "anchor": { "type": "edge", "index": 0, "t": 0.5 },
      "offset": { "dx": 0, "dy": 0, "units": "px" },
      "align": "center",
      "print": { "text": "3", "lang": "en" },
      "label_dom": "#label-CA"
    }
  ]
}
```

**Notes for the JIM author:**
- `edge/index` here assumes a single‑segment edge per id. For multi‑segment paths, either:
  - (a) interpret `index` as the *i‑th drawn segment*; or
  - (b) prefer a `path` anchor with `s ∈ [0..1]` (fraction of total path length) instead of `edge/index`.
- Offsets are in **post‑transform pixels** at authoring scale. If coordinate space differs, add `meta.coordinateSpace: "screen"|"local"` at top level.

---

## Auto‑upgrade pattern (for existing grouped SVGs)

If an SVG already groups geometry with a `<text>` label but lacks JIM semantics:

1) Compute a sensible anchor (edge midpoint, centroid, etc.).
2) Derive `offset = (textPosition − anchorPosition)`.
3) Emit a `labels` entry with `label_dom` pointing to the `<text>` node.
4) Keep the visible SVG unchanged.

This makes today’s files JIM‑aware with zero visual diffs.

---

## Accessibility and editing implications

- A blind‑friendly editor can present each label as a row (name, target, anchor, offset), with keyboard nudges to change `dx/dy` and dialogs to change anchors (vertex/edge/path/centroid) without using the mouse.
- The optional `pinned` field lets human‑tuned placements survive future auto‑layout.

---

## Optional JSON Schema fragment (sketch)

```json
{
  "$id": "https://example.org/jim/labels.schema.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "labels": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "targets", "anchor", "offset"],
        "properties": {
          "id": {"type": "string"},
          "targets": {"type": "array", "items": {"type": "object", "properties": {"selector": {"type": "string"}}, "required": ["selector"]}},
          "anchor": {
            "oneOf": [
              {"type": "object", "properties": {"type": {"const": "vertex"}, "index": {"type": "integer", "minimum": 0}}, "required": ["type", "index"]},
              {"type": "object", "properties": {"type": {"const": "edge"}, "index": {"type": "integer", "minimum": 0}, "t": {"type": "number", "minimum": 0, "maximum": 1}}, "required": ["type", "index"]},
              {"type": "object", "properties": {"type": {"const": "path"}, "s": {"type": "number", "minimum": 0, "maximum": 1}}, "required": ["type", "s"]},
              {"type": "object", "properties": {"type": {"const": "centroid"}}, "required": ["type"]},
              {"type": "object", "properties": {"type": {"const": "point"}, "x": {"type": "number"}, "y": {"type": "number"}}, "required": ["type", "x", "y"]}
            ]
          },
          "offset": {"type": "object", "properties": {"dx": {"type": "number"}, "dy": {"type": "number"}, "units": {"type": "string", "enum": ["px", "mm"]}}, "required": ["dx", "dy"]},
          "align": {"type": "string", "enum": ["start", "center", "end"]},
          "leader": {"type": "object", "properties": {"enabled": {"type": "boolean"}, "style": {"type": "string", "enum": ["straight", "none"]}}},
          "pinned": {"type": "boolean"},
          "print": {"type": "object", "properties": {"text": {"type": "string"}, "lang": {"type": "string"}}},
          "braille": {"type": "object", "properties": {"text": {"type": "string"}, "code": {"type": "string"}}},
          "label_dom": {"type": "string"}
        }
      }
    }
  }
}
```

---

**Summary.** This proposal defines just enough structure (anchor + offset + align) to make labels deterministic across tools and accessible to blind editors, while preserving your current SVG grouping and keeping the extension optional.

