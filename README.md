# RAINWEAVER — readable source

This repository contains the readable development source for the JS13K 2026 entry **RAINWEAVER**.

The submitted `game.zip` remains unchanged and is the authoritative competition artifact. This source tree is provided so reviewers can inspect the implementation rather than only the packed runtime.

## What is included

- `src/renderer3d.js` — custom WebGL2 renderer, shaders, shadows and bloom
- `src/grove.js` — procedural forest scenery
- `src/course.js` — deterministic endless-course generation
- `src/motion.js` — movement, collision and tether constraint
- `src/character.js` — procedural unicorn geometry and animation
- `src/rainweaver.js` — game state and mechanics
- `src/score.js` — procedural Web Audio music and sound
- `src/main.js` — browser entry point
- `test/` — regression and behavior checks
- `tools/build.mjs` — bundling, minification and 13KB packaging pipeline

## Build

Requires Node.js 20+.

```bash
npm install
npm run build
```

The build produces `dist/index.html` and `dist/game.zip`.

## Test

```bash
npm test
```

## Provenance

This is the closest preserved readable development snapshot from before the later mountain/cliff background revision. It includes small cleanup and debugging changes made after the original upload, so it is not claimed to be byte-identical to the source tree at the exact moment of submission. The existing competition `game.zip` remains the authoritative submitted build.

AI tools were used as technical assistance during development and debugging, including help with some web-rendering implementation. The source is published so the implementation can be reviewed directly.
