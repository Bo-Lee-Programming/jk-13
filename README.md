# RAINWEAVER — JS13K 2026

RAINWEAVER is an endless WebGL2 grappling/swinging game: catch branches, build momentum, release to fly, collect dew, avoid hazards, and stay ahead of the darkness.

## Source code

Readable development source is now available in **[`dev/`](./dev/)**.

For provenance, this repository keeps three things separate:

1. **`game.zip`** — the original submitted JS13K archive, 13,310 bytes. This is the authoritative competition artifact.
2. **`src/`** — mechanically unpacked runtime JavaScript recovered from that exact submitted archive.
3. **`dev/`** — the closest preserved readable development snapshot from before the later mountain/cliff background revision.

The readable snapshot includes small cleanup/debugging changes made after upload, so it is not claimed to be a byte-identical reconstruction of the submission-time source tree.

AI tools were used as technical assistance during development and debugging, especially for some web-rendering implementation. The readable source is published so reviewers can inspect the implementation directly.

## Controls

- A / D — move / swing
- Space — jump
- Hold E or mouse — catch
- Release — fly
- Shift while attached — shorten the thread
- R — new run
- Esc — pause
- M — sound

## Technical notes

- WebGL2 custom renderer and shaders
- Procedural geometry and endless world generation
- Procedural Web Audio music and sound
- Fixed 120 Hz simulation step
- Best-distance persistence with localStorage
- No external image/audio assets required at runtime

## Run the exact recovered submission

From the repository root:

```bash
python -m http.server 8000
```

Then open:

```
http://localhost:8000/src/
```

## Build the readable development source

```bash
cd dev
npm install
npm run build
npm test
```
