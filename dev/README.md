# RAINWEAVER — readable development source

This directory contains the closest preserved readable development snapshot of RAINWEAVER from before the later mountain/cliff background revision.

The repository root keeps the exact competition artifact as `game.zip`. The `src/` directory at the repository root contains a mechanically unpacked runtime recovered from that exact submitted archive.

This `dev/` tree is provided so reviewers can inspect the implementation in readable modules: the WebGL2 renderer, procedural world generation, character animation, rope/swing simulation, procedural Web Audio, tests, and build pipeline.

## Provenance

This readable snapshot is not claimed to be byte-identical to the source tree at the instant of submission. It includes small cleanup/debugging changes made after the upload. The root `game.zip` is the authoritative original submission.

The later mountain/cliff/waterfall background revision is intentionally **not** included here.

AI tools were used as technical assistance during development and debugging, especially for some web-rendering implementation. The source is published so the implementation can be reviewed directly.

## Main files

- `src/renderer3d.js` — WebGL2 renderer, shaders, shadows and bloom
- `src/grove.js` — procedural forest scenery
- `src/course.js` — deterministic endless course generation
- `src/motion.js` — movement, collision and tether constraint
- `src/character.js` — procedural unicorn geometry and animation
- `src/rainweaver.js` — game state and mechanics
- `src/score.js` — procedural Web Audio music and sound
- `src/main.js` — browser entry point

## Build

Requires Node.js 20+.

```bash
npm install
npm run build
```

The build writes `dist/index.html` and `dist/game.zip`.

## Test

```bash
npm test
```
