# Bunny Bite

A single-page 3D toy: a bunny-shaped ice cream sitting in a little display
case. Drag to spin it around, then tap it — it plays a crunchy bite sound
and the scoop visibly gets eaten into.

## How it's built

- **Plain static site** — one `index.html`, no build step, no framework.
  Vercel (or any static host) serves it as-is.
- **[three.js](https://threejs.org) r128** (loaded from jsDelivr) renders
  the model with `GLTFLoader` + `OrbitControls`. Lighting is a warm
  key/fill/rim setup tuned for the cream-and-berry "display case" look;
  the contact shadow under the model is a canvas-generated radial-gradient
  texture rather than real shadow maps (cheaper, and looks right for a
  small stylized object like this).
- **The "munch" sound is synthesized**, not a file — two filtered noise
  bursts via the Web Audio API on tap. Zero audio payload, plays instantly.
- **`models/bunny1.glb` / `models/bunny2.glb`** are the "whole scoop" and
  "bitten" stages. The originals shipped with 8K/4K textures (~13.7MB and
  ~4.5MB); textures were resized to 1024px JPEGs and the `.glb` binary
  buffers rebuilt around them (mesh geometry untouched), bringing them to
  ~1.3MB and ~1.5MB — a real difference in page-load time with no visible
  quality loss at the size these render on screen.

## Running locally

Because the page fetches the `.glb` files by relative URL, opening
`index.html` directly (`file://`) will hit CORS restrictions in most
browsers. Serve it over HTTP instead:

```sh
npx serve .
# or: python3 -m http.server 8080
```

## Deploying

No configuration needed — push to a repo connected to Vercel (or drag the
folder into Netlify, GitHub Pages, etc.) and it deploys as a static site.

## Extending it

A third stage (`bunny_icecream_3`, an even-more-eaten scoop) was provided
alongside the first two but isn't wired up — the current interaction is a
single bite (stage 1 → stage 2). Adding a second bite that advances to a
stage 3, or loops back to stage 1, is a small change to the `bite()`
function in `index.html`.
