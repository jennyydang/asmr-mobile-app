# Bunny Bite

A single-page 3D toy: a bunny-shaped ice cream, plain background, model
centered in the middle of the page. Drag to spin it around, then tap it —
each tap plays a crunchy bite sound and eats further into the scoop.

Three bites, in order:

1. Whole scoop → bitten once
2. Bitten once → bitten twice (down to the cone)
3. Bitten twice → gone (shrinks away entirely)

After the third bite there's nothing left to click.

## How it's built

- **Plain static site** — one `index.html`, no build step, no framework.
  Vercel (or any static host) serves it as-is.
- **[three.js](https://threejs.org) r128** (loaded from jsDelivr) renders
  the model with `GLTFLoader` + `OrbitControls`, full-viewport, no UI
  chrome. The contact shadow under the model is a canvas-generated
  radial-gradient texture rather than real shadow maps (cheaper, and looks
  right for a small stylized object like this) — it fades out along with
  the model on the final bite.
- **The "munch" sound is synthesized**, not a file — two filtered noise
  bursts via the Web Audio API on tap. Zero audio payload, plays instantly.
- **`models/bunny1.glb` / `bunny2.glb` / `bunny3.glb`** are the three bite
  stages. The originals shipped with 8K/4K textures (13.7MB / 4.5MB /
  3.3MB); textures were resized to 1024px JPEGs and the `.glb` binary
  buffers rebuilt around them (mesh geometry untouched), bringing them to
  ~1.3MB each — a real difference in page-load time with no visible
  quality loss at the size these render on screen.
- All three stages preload up front (so each bite is instant, no
  mid-interaction loading), and share one scale factor computed from
  stage 1 — the models are authored in the same coordinate system, so
  reusing that factor keeps their relative size correct across bites
  instead of each one being independently normalized to the same size.

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
