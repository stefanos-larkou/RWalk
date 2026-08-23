# RWalk

A random walk visualiser in one, two and three dimensions. Watch a crowd of walkers wander away from
a shared origin, scrub through the walk a step at a time, then measure a much larger ensemble
against what probability theory says should happen.

React component library, built to be dropped into a host application and take its theme.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
  - [Repository layout](#repository-layout)
  - [Tracks are data, not drawings](#tracks-are-data-not-drawings)
  - [Three renderers, one rule](#three-renderers-one-rule)
  - [What the statistics claim](#what-the-statistics-claim)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running the harness](#running-the-harness)
- [Using it in an application](#using-it-in-an-application)
  - [The visualiser](#the-visualiser)
  - [The decorative walk](#the-decorative-walk)
  - [Theme inheritance](#theme-inheritance)
- [Testing](#testing)
- [Licence](#licence)

## Features

**Dimensions**: One, two or three. In one dimension the walk is drawn as position against step
number; above it, as a path through the lattice. Three dimensions is a scene you can orbit.

**Steps**: Each step moves one unit along a single axis, or along any combination of them when
diagonal moves are on. Diagonals are disabled in one dimension, where they would change nothing:
`{-1, 0, 1}` minus the zero is the same two moves either way.

**Playback**: Play, pause, step forwards or backwards by a configurable number of steps, scrub
anywhere in the walk, restart.

**Framing**: Stable limits fixes the view to where the whole walk will eventually reach, so the
scale never shifts under you. Turned off, the view tracks what has been drawn so far and the walk
fills the canvas as it grows.

**Zoom**: The wheel zooms in every dimension. Dragging pans in one and two dimensions and orbits in three, where
panning is off and turning the walk is what a drag is for.

**Statistics**: A separate view, available once a walk has played out, that runs a far larger
ensemble and draws three measurements against their analytic forms.

**Throughout**: Light and dark palettes chosen by the host's theme, a canvas that resizes with its
container, and every control persisted to `localStorage` under `rwalk:*`.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | React 19 |
| Language | TypeScript 6.0 |
| UI | MUI 9 with Emotion |
| Rendering | Canvas 2D in one and two dimensions, three.js in three |
| Charts | Chart.js 4 |
| Shared foundation | [sim-kit](https://github.com/stefanos-larkou/sim-kit) for playback, controls and persistence |
| Build | Vite 8, library mode with `vite-plugin-dts` |
| Tests | Vitest 4 with jsdom and React Testing Library |

## Architecture

The library is a thin shell of React around a core that knows nothing about React, the DOM, or the
canvas. Generating a walk, bounding it, measuring it and choosing an axis interval are all pure
functions, which is where almost all of the test coverage lives.

Everything with no opinion about walks lives in **sim-kit** instead: the playback transport, the
seeded generator, the slider and numeric controls, the persistence hooks and the element-size hook.

### Repository layout

```text
src/
  core/        Pure logic - no React, no DOM, no canvas
  render/      Canvas drawing, the layout it needs, and the palette
  three/       The three.js scene and the geometry it is built from
  charts/      Chart.js registration and the configurations for each chart
  components/  The component shell and the walk-specific controls
  hooks/       useWalkScene, which assembles the whole derived chain
  dev/         Local harness for debugging, not shipped
```

### Tracks are data, not drawings

A walk is a pure function of its options and a generator. It returns positions and nothing else:

```ts
interface Track {
    readonly dimensions: number;
    readonly positions: Int32Array;
}
```

Every walker is one flat typed array of `(steps + 1) * dimensions` integers, so a walk of ten
thousand steps is a single allocation. A position is read back
out with `positionAt`, and a step's offsets come from `offsetsFor`, which builds them from the
dimension count rather than branching on it.

**One generator serves a whole ensemble.** `walksFor` seeds once and draws every walker from that
single stream. Seeding each walker separately with `seed + i` looks equivalent and is not: the
generator's seed is its state, so adjacent seeds give streams that start at adjacent values, and
every walker takes an identical first step.

### Three renderers, one rule

Anything animated at 60 Hz is drawn by hand; a settled result with axes and tooltips gets Chart.js.

- **One and two dimensions** are a canvas. Thirty walkers of ten thousand points each, redrawn while
  scrubbing, is more than a charting library will keep up with.
- **Three dimensions** is three.js with an orthographic camera and `OrbitControls`, loaded through a
  dynamic import so a two-dimensional walk never pulls WebGL into the bundle. Every object it
  creates goes into a bin that disposes of it on unmount, because a decorative walk can create and
  destroy a WebGL context every few seconds.
- **The statistics** are Chart.js, registered component by component.

### What the statistics claim

Each chart is a claim that can be checked, drawn beside the analytic form it should match.

**Mean squared displacement against step count.** For a walk with no diagonals every step has
length one exactly, so `MSD(N) = N` in every dimension and the measurement lands on `y = x` with no
fitting. Diagonals multiply it by a constant that follows from the offsets:

```text
E|v|^2  =  d * 2 * 3^(d-1) / (3^d - 1)        1D: 1     2D: 1.5     3D: 27/13 ~ 2.077
```

**Where the walkers end up.** After `N` steps a position is Gaussian, so the distance from the
origin follows a chi distribution with `d` degrees of freedom: half-normal in one dimension,
Rayleigh in two, Maxwell-Boltzmann in three. Three visibly different curves from one toggle, and the
bars landing on them is the central limit theorem on screen.

**Walkers that find their way home.** Polya's theorem: a walk is recurrent in one and two dimensions
and transient in three. The 1D curve climbs fast, 2D keeps climbing, and 3D flattens against a
ceiling at 0.3405373.

> That constant is for the six-neighbour cubic lattice. With diagonals on there are twenty-six
> neighbours and the constant is a different one, so the reference line is hidden.

None of this needs tracks kept. The ensemble accumulates one running sum per step index and two
numbers per walker, which is what lets the statistics run thousands of walkers where the animated
view runs tens.

## Getting started

### Prerequisites

- Node 24+

### Running the harness

```bash
npm install
npm start
```

| Command | What it does |
| --- | --- |
| `npm start` | Harness at `http://localhost:5173` |
| `npm test` | Vitest, headless |
| `npm run lint` | ESLint |
| `npm run build` | Library bundle and type declarations into `dist/` |
| `npm run check` | Lint, test and build |

CI runs lint and test only. The build happens inside `npm ci`, because `prepare` builds `dist/` and
scripts have to run for the sim-kit git dependency to build its own, so a separate build step
would build this package twice.

## Using it in an application

Install it as a git dependency. There is no published package:

```bash
npm i github:stefanos-larkou/RWalk
```

`prepare` builds `dist/` on install, so the consumer never sees TypeScript source. sim-kit comes
with it as a nested git dependency and builds itself the same way, which puts two requirements on
the host:

- **Do not install with `npm ci --ignore-scripts`.** Neither package's `dist` would be built, and
  both would resolve to files that do not exist.
- **A CI runner needs the https rewrite**, because npm records `github:` dependencies as ssh URLs
  in the lockfile and a runner has no key:

  ```bash
  git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"
  ```

Lockfiles pin commit SHAs, so a new version of either package reaches the host only through
`npm update`, not `npm install`.

### The visualiser

`RWalk` is the whole thing, controls and all. It takes no props, owns its own state and persists it.

```tsx
import { RWalk } from "@stefanos-larkou/rwalk";

<RWalk />
```

### The decorative walk

`AutoWalk` is a bare walk with no axes and no controls, which plays itself and reports when it is
done.

```tsx
import { AutoWalk } from "@stefanos-larkou/rwalk";

<AutoWalk
    key={run.id}
    seed={run.seed}
    dimensions={2}
    walkers={12}
    steps={1200}
    speed={400}
    diagonals
    onFinished={next}
/>
```

> **Give every run a fresh `key`.** `AutoWalk` runs once per mount. Changing `seed` on a live
> instance leaves its "already reported" flag set, so `onFinished` never fires again, and the
> playback keeps its index across the change, so a shorter new walk can read as finished the moment
> it starts.

`speed` is steps per second. The host chooses `dimensions`, deliberately: three-dimensional walks
are the ones that load three.js and hold a WebGL context, and that cost belongs where it can be
seen rather than hidden behind a random choice.

### Theme inheritance

The library never calls `createTheme`. It reads the host's theme through context, which holds only
while there is **one copy** of React, MUI and Emotion in the tree. A second copy is not an error,
the component simply reads a default theme and the host's palette silently fails to apply.

It reads only tokens every host has: `palette.primary`, `palette.divider`, `palette.text`,
`spacing`, `breakpoints`, and `palette.mode` to choose between the light and dark palettes. The
canvas and chart colours are the library's own, in `render/palette.ts`, chosen by mode rather than
taken from the theme, because a host's palette says nothing about how twenty walkers should be told
apart.

## Testing

```bash
npm test
```

Headless, no browser and no server. Every module with behaviour has a test beside it. Constants,
types, the storage keys, the Chart.js registration and the dev harness do not.

Random output is tested by its invariants instead of its value: a walk without diagonals moves along
exactly one axis per step, no two walkers of an ensemble share a track, a bounding box never shrinks
as the walk goes on and grows by at most one step per axis, and a histogram's bars add up to one.

Physical results are only claimed where they are checked. Mean squared displacement is asserted
against the analytic line in every dimension and with diagonals on; the returns curve is held under
Polya's ceiling in three dimensions and shown to bring far more walkers home in one; and both cases
where the ceiling does not apply are asserted to withhold it.

Neither renderer can run for real under jsdom, so each is met at its seam. The canvas is given a
recording context, which turns drawing into a list of calls that can be asserted, so the axes,
clipping and zoom are tested through what they draw. The three.js scene has only `WebGLRenderer` and
`OrbitControls` replaced, leaving the geometry to run for real, and asserts that the context it
takes is given back when the component unmounts.

`test-setup.ts` stubs what jsdom lacks. The `ResizeObserver` stub comes from `sim-kit/testing`, since
every consumer of `useElementSize` needs the same one. The canvas context stays here because the two
visualisers need different ones, and so does the pointer capture API, which jsdom implements none of
and a slider reaches for as a drag ends.

## Licence

MIT ([LICENSE](LICENSE)).
