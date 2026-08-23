# ASMR Tap

A touch-first ASMR trigger app built with Expo/React Native. Instead of a
camera watching hand gestures, *you* are the hands — every trigger reacts
directly to taps and drags on the screen with synchronized sound and haptic
feedback.

## Triggers

- **Wax Cracking** — drag across a slab of wax to snap jagged cracks through it.
- **Nail Tapping** — tap five fingertip "nails" in any rhythm.
- **Slime** — press and drag to stretch a slime blob (rendered as a live
  metaball connector), with a squelch loop that plays while you drag and a
  pop on release.
- **Keyboard** — a full clicky-mechanical keyboard; type anything, it's just
  for the sound.
- **Bubble Wrap** — pop a 6×9 sheet of bubbles one at a time.
- **Soap Cutting** — drag a "knife" across a bar of soap to slice grooves
  into it, with a continuous scraping sound while you cut.

Every trigger screen has a **Reset** button (top right) to clear it and
start fresh.

## How it's built

- **Expo (React Native, TypeScript)** — `App.tsx` + `@react-navigation`
  stack navigation between the home screen and each trigger screen.
- **`expo-haptics`** — every tap/drag fires an appropriately scaled impact
  (`light`/`medium`/`heavy`/`soft`/`rigid`) via `src/haptics/haptics.ts`.
  Haptics only fire on physical devices — simulators and web silently no-op.
- **`expo-audio`** — all sound effects are procedurally synthesized (see
  below) and played through small round-robin player pools
  (`src/audio/useSoundPool.ts`) so rapid taps can overlap, plus a looping
  player helper (`src/audio/useLoopingSound.ts`) for continuous textures
  (slime squish, soap scraping).
- **`react-native-svg`** — cracks, cuts, and the slime blob are drawn as SVG
  paths built up from touch coordinates each frame.
- Touch/drag input uses React Native's built-in `PanResponder` — no gesture
  library dependency needed for this interaction set.

## Sounds

Every `.wav` in `assets/sounds/` is procedurally generated (noise bursts,
filtered envelopes, and pitch sweeps — no recorded/licensed audio) by
`scripts/generate_sounds.py`. Re-run it any time to regenerate or tweak the
sound set:

```sh
python3 scripts/generate_sounds.py
```

## Running the app

```sh
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i`/`a` for a
simulator/emulator. Haptics require a real device — simulators can't
render them.
