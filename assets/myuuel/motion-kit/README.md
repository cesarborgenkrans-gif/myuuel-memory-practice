# Myuuel motion kit — start here

Working rule: copy the small modules and rig data below, keep approved PNG bytes intact, feed the controller elapsed milliseconds and optional played-audio RMS, and draw furniture as an optional separate layer. The Character Showcase uses this exact kit.

## Run the minimal example

Open **example.html** directly. It needs no server, package installation, keys, chat application or microphone. The exact-byte image wrapper keeps local Canvas pixel reads available from file://. Copy this entire folder to another location and the example still works.

> **In Myuuel Memory Practice:** this copy ships the sheets as WebP (alpha unchanged), without the example page or the character showcase, and its adapter takes optional per-sheet scales. The app's own registration lives in `src/renderer/seated-registration.js`.

## Copy into a runtime

Copy **modules/** and **rig/**, plus the approved PNGs you need from **assets/**. All 16 approved sheets are included byte-for-byte. `approved-sheets.json` supplies their descriptors with local paths, anchors and timings. Replace image URLs only when adapting your runtime's asset loader. The minimal example and the full collection are self-contained.

Load these classic scripts in order, or import them for side effects in your bundler:

```html
<script src="modules/myuuel-dress-wind.js"></script>
<script src="modules/myuuel-smooth-motion.js"></script>
<script src="modules/myuuel-audio-motion.js"></script>
<script src="rig/motion-registration.js"></script>
<script src="rig/myuuel-motion-profiles.js"></script>
<script src="modules/myuuel-character.js"></script>
```

```js
const actorCanvas = document.createElement('canvas');
const actor = MyuuelCharacter.create(actorCanvas, {
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
});

// `sheet` is one descriptor from approved-sheets.json.
// Load an origin-clean Image: same-origin HTTP asset, or exact data URI locally.
const image = new Image();
image.onload = () => actor.setSheet(sheet, image);
image.src = sheet.image;

let previous;
function frame(now) {
  actor.update(previous === undefined ? 0 : now - previous);
  previous = now;
  // Draw actorCanvas into your scene with one uniform display scale.
  // The controller output is transparent and always 384 x 512.
  scene.drawImage(actorCanvas, x, y);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

The host owns requestAnimationFrame and visibility handling. Reset the previous timestamp after returning from a hidden tab. `update` caps one elapsed step at 60 ms, matching the reviewed preview. Call it once per rendered frame, not once per effect.

## Public API

| Call | Purpose |
| --- | --- |
| `MyuuelCharacter.create(canvas, options)` | Creates the 384 × 512 character renderer. Optional custom registration/profiles can replace the defaults. |
| `actor.setSheet(descriptor, loadedImage)` | Selects an eight-frame sheet; resets its pose phrase, preserves the continuous wind clock. |
| `actor.update(deltaMs)` | Advances pose playback, the RMS spring and independent wind timing, then renders. |
| `actor.configure({paused, motion, wind, windStrength, reducedMotion})` | Changes explicit controls. Strength is 0–2. A pause freezes the clocks; reduced motion disables motion/wind and pose cycling. |
| `actor.render()` | Renders at the current time without advancing it. |
| `actor.setFrame(0..7)` / `actor.step()` | Pauses and displays a source drawing, including drawings omitted from the curated phrase. |
| `actor.audio.begin(kind, key)` | Starts a keyed input/output audio turn. |
| `actor.audio.sample(kind, key, rms)` | Supplies normalized numeric RMS 0–1. Mismatched/stale turn keys are rejected. |
| `actor.audio.end(kind, key)` | Ends that turn; the spring settles. |
| `actor.snapshot()` | Exposes frames, clocks, support target, spring and painter state for diagnostics/tests. |

`motion` controls upper-body smoothing, breathing and squish. Wind remains independent: it can move the dress while body motion and audio are off. The descriptor's `clothWind` must also be true; the standing cloth field is intentionally not applied to folded seated clothing.

## Feed real audio; keep the demo separate

Drive the spring from the audio actually being played/captured, rather than from text length or network arrival times. Sample RMS regularly (for example 20–60 Hz). Only numbers and a turn key enter this engine.

```js
const turn = 'tts-turn-42';
actor.audio.begin('output', turn);
// In your playback analysis callback:
actor.audio.sample('output', turn, playedAudioRms);
// On playback end/cancellation:
actor.audio.end('output', turn);
```

The example and showcase use a clearly labeled silent synthetic RMS sample. They do not supply lip sync, a voice, speech synthesis, audio capture or AI/backend integration. The adapter's real-audio seam is the three calls above.

## The three effects

**Pose registration and body motion — modules/myuuel-smooth-motion.js.** The reviewed Canvas painter is copied byte-for-byte. It translates each source frame using rig/motion-registration.js and renders one continuous upper-body texture mesh. A smooth weight falls from 1 at y=190 to 0 at y=360. The seated support is registered at y=360; standing boots remain below the deformation boundary. The background/furniture never enters this mesh.

Listening and Happy Wave use authored face pivots and deliberate directed pose phrases in rig/myuuel-motion-profiles.js. Keep these pivots/phrases with the character. Inferring eyes from gold-colored pixels previously mistook hair highlights for eyes and caused jerks. No inferred eye-angle correction is used. Head translation is eased over 180 ms only across compatible pose edges; it does not invent missing arm drawings.

**Speech squish — modules/myuuel-audio-motion.js.** `createReactor` is extracted with its original function body intact. It gates RMS, follows an envelope (45 ms attack / 170 ms release), and advances a damped 3.1 Hz spring using at most 1/240-second substeps. Damping is 0.62; input/output maxima are 0.013 / 0.024, with a final −0.012..0.032 clamp. RMS becomes stale after 180 ms. The renderer applies this scalar above the pinned support, rather than scaling the whole character and moving her feet.

**Dress wind — modules/myuuel-dress-wind.js.** This reviewed module is copied byte-for-byte. It warps the two free lower side panels with non-overlapping four-pixel horizontal strips. The join at y≤360 and central x=135..245 leg/boot corridor remain fixed. A 52-pixel influence ramp lets more fabric participate above the hems. The lateral wave uses a continuous clock, gentle gust/ripple components and a slight phase difference between sides. Pose changes and silence do not reset wind; pause freezes it. There are no detached duplicate skirt layers.

Those dimensions are Myuuel's rig, not universal clothing segmentation. For another character, author registration, face pivots, reviewed phrase edges and a cloth mask for that artwork. Preserve the separation between source geometry, body motion, cloth movement and world-space furniture.

## Optional stool / platform

The character controller never loads or requires furniture. `descriptor.support` defines the contact anchor, even when the scene draws no support. For edge perch, retain the seated `[192,360]` target when the stool is hidden.

Optional `modules/myuuel-stage.js` reproduces the preview's furniture composition:

```js
MyuuelStage.draw(sceneCanvas, actor.canvas, {
  support: sheet.support,       // 'stool' or 'platform'
  standing: sheet.posture === 'Standing',
  stool: loadedStoolOrNull,
  showSupport: false,           // character still renders with its same anchor
  scale: 1
});
```

The optional stool is included under optional-assets/ with its hash in optional-support.json. The minimal example does not load it. A production scene may provide its own chair/world geometry or no furniture at all. The showcase has a Stool / platform toggle; it does not alter character timing, anchoring or deformation.

## Files and verification

- **example.html / example.js** — smallest working consumer, independent of the showcase UI.
- **modules/myuuel-character.js** — public adapter; no document selectors, chat, backend or rAF ownership.
- **modules/myuuel-smooth-motion.js**, **myuuel-dress-wind.js**, **myuuel-audio-motion.js** — the three reusable engines.
- **rig/** — exact character registration and reviewed phrase/pivot data.
- **approved-sheets.json** — current sheet descriptors and original file hashes.
- **provenance.json** — copied-module source hashes, extracted-function evidence and example PNG hash.
- **kit-manifest.json** — exact distributable file hashes.

The source copies and shared AI Discussion/Momotamu files remain preserved. Tests check the original numeric reactor against the extracted one, actual approved frames, pinned support, silence/pause/reduced motion, wind phase continuity and support visibility independence. Native Canvas evidence is distinct from browser layout/performance or a production-game integration. See ../showcase/checks.json for the current results.
