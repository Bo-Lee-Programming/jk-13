# RAINWEAVER — JS13K 2026

This repository preserves the original JS13K submission and a mechanically recovered runnable source form.

## Files

- `game.zip` — original submitted archive, 13,310 bytes.
- `src/index.html` — loader for the recovered runtime source.
- `src/game.recovered.js` — JavaScript mechanically unpacked from the self-decompressing code in the submitted `index.html`.

## Source status

The recovered JavaScript is not the original pre-minification development source tree. It preserves the unpacked runtime program, but original file boundaries, comments, formatting, and many descriptive variable names were already lost during minification/packing.

When the original development folder is recovered from the local machine, it can be added alongside this version without replacing the preserved submission archive.

## Game

RAINWEAVER is an endless WebGL2 grappling/swinging game: catch branches, build momentum, release to fly, collect dew, avoid hazards, and stay ahead of the darkness.

### Controls

- A / D — move / swing
- Space — jump
- Hold E or mouse — catch
- Release — fly
- R — new run
- Esc — pause
- M — sound

The recovered runtime also contains a Shift input that shortens the rope while attached.

## Technical notes

- WebGL2 with custom shaders
- Procedural geometry/world generation
- Web Audio API procedural audio
- Fixed 120 Hz simulation step
- Best-distance persistence via localStorage
- No external image/audio assets are required by the recovered runtime

## Run locally

From the repository root:

```bash
python -m http.server 8000
```

Then open:

```
http://localhost:8000/src/
```
