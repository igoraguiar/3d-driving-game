# AGENTS.md

## Project Context

A real-time 3D driving simulator built with Three.js that renders a side-view car on an infinite scrolling road with parallax scenery (trees, hills, clouds, other vehicles). The experience is cinematic — sunset lighting, fog, dust particles, and subtle car body vibration — and interactive via mouse orbit + WASD camera controls.

## Tech Stack

| Layer | Tool |
|-------|------|
| Runtime | Bun (package manager + dev server) |
| Language | TypeScript 5 (strict mode, no emit) |
| 3D Engine | Three.js `^0.184.0` (r184+, physically-based lighting) |
| Shaders | Inline GLSL via `ShaderMaterial` |
| Styles | Plain CSS, no framework |
| Bundling | None — ES modules served directly by Bun |

## Directory Map

```
├── index.html        # Entry point; loads src/main.ts as ES module
├── src/
│   └── main.ts       # All game logic (~1200 lines, single-file architecture)
├── style.css         # Minimal overlay styles
├── tsconfig.json     # TypeScript config (strict, noEmit)
├── package.json      # Dependencies + scripts
└── PROMPT.md         # Original design brief
```

**`src/main.ts` structure (top to bottom):**

1. Type declarations (`GameConfig`, `SceneryPool`, `CameraControls`, etc.)
2. `CONFIG` — tunable constants (speed, road dimensions, colors, fog)
3. Scene, renderer, camera setup
4. IIFE blocks: sky dome, sun disc, lighting (ambient + directional + hemisphere + back)
5. Road group (surface, edge lines, dashed center, grass)
6. Car model (body, cabin, wheels, mirrors, lights — procedural geometry)
7. Scenery factory functions (`createTree`, `createPole`, `createCloud`, etc.)
8. Scenery pools + `initPool` (object-pooled parallax layers)
9. Camera controls (mouse orbit, scroll zoom, WASD pan, touch)
10. Dust particle system (`PointsMaterial`)
11. `animate()` loop (wheel spin, car bob, pool recycling, particles, camera, render)
12. Resize handler

## Commands

```bash
bun install          # Install dependencies (three + @types/three)
bun run dev          # Start dev server (opens index.html in browser)
bun run typecheck    # Run TypeScript type checker (no emit)
```

No test runner or linter is configured. Add one before introducing complex refactors.

## Rules of Engagement

### ✅ Always

- Keep `CONFIG` at the top of `src/main.ts` as the single source of tunable values.
- Define interfaces at the top of the file (see `GameConfig`, `SceneryPool`, etc.).
- Use explicit return types on all functions (`: void`, `: THREE.Group`, etc.).
- Use IIFE blocks (`(function() { … })()`) for self-contained scene setup sections.
- Prefer `THREE.Group` hierarchies for composite objects (car, trees, poles).
- Object-pool scenery items; recycle positions in the `animate()` loop instead of creating/destroying meshes.
- Use `THREE.Clock` delta time for all motion (already in place — keep it).
- Cap `dt` with `Math.min(clock.getDelta(), 0.05)` to prevent physics explosions on tab-switch.
- Set `castShadow` / `receiveShadow` explicitly on meshes that need it.
- Use physically-based light intensities (r184+ uses lux, not arbitrary units).
- Use `instanceof` for Three.js type narrowing (`child instanceof THREE.Mesh`), not `isMesh`/`isGroup` property checks on `Object3D`.
- Use `THREE.Object3D` as the parameter type for `PositionFn` callbacks (contravariance).
- Run `bun run typecheck` before declaring work done — zero errors required.

### 🚫 Never

- Use `any`, `// @ts-ignore`, or `as any` — fix the type properly instead.
- Commit `node_modules/`, `.env`, or build artifacts (`.gitignore` already covers `node_modules/`).
- Inline-create geometry or materials inside the `animate()` loop (causes GC pressure).
- Use `innerHTML` or inline event handlers in HTML.
- Add inline CSS styles to elements; extend `style.css` instead.
- Break the single-file architecture by splitting `src/main.ts` unless the file exceeds 1200 lines or a new agent explicitly proposes a modular refactor in a commit.

## Code Style

- **Indentation:** Tabs (2-space visual width in editor).
- **Quotes:** Double quotes for strings.
- **Semicolons:** Yes.
- **Naming:** `camelCase` for variables/functions, `CONSTANT_CASE` for CONFIG keys, `PascalCase` for interfaces/types.
- **Sections:** Separate logical blocks with `// ─── SECTION NAME ─────────────────────` comment headers.

## Golden Example

```typescript
// ─── SCENERY FACTORY ────────────────────────────────────────

/**
 * Create a procedural tree with randomized trunk and foliage.
 * @returns A group containing trunk + cone layers.
 */
function createTree(): THREE.Group {
 const group = new THREE.Group();
 const trunkH = 2 + Math.random() * 3;
 const trunkR = 0.12 + Math.random() * 0.1;

 const trunkGeo = new THREE.CylinderGeometry(
  trunkR * 0.7,
  trunkR,
  trunkH,
  8,
 );
 const trunkMat = new THREE.MeshStandardMaterial({
  color: new THREE.Color().setHSL(0.07, 0.4 + Math.random() * 0.3, 0.15),
  roughness: 0.9,
 });
 const trunk = new THREE.Mesh(trunkGeo, trunkMat);
 trunk.position.y = trunkH / 2;
 trunk.castShadow = true;
 group.add(trunk);

 const layers = 2 + Math.floor(Math.random() * 2);
 for (let l = 0; l < layers; l++) {
  const r = (1.2 + Math.random()) * (1 - l * 0.2);
  const h = (1.0 + Math.random() * 0.5) * (1 - l * 0.15);
  const fGeo = new THREE.ConeGeometry(r, h, 8);
  const fMat = new THREE.MeshStandardMaterial({
   color: new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.5, 0.15),
   roughness: 0.85,
  });
  const foliage = new THREE.Mesh(fGeo, fMat);
  foliage.position.y = trunkH + l * h * 0.5 + 0.2;
  foliage.castShadow = true;
  group.add(foliage);
 }

 return group;
}
```

## Notes for Future Refactors

- If splitting `src/main.ts` into modules, keep the `CONFIG` object and type declarations in `src/types.ts` and import them everywhere.
- Consider extracting scenery factories into `scenery/` before the file exceeds 1200 lines.
- A proper build step (Vite or esbuild) is not needed until ES module imports grow beyond `three` + local CSS.
- `tsconfig.json` uses `noEmit: true` — Bun handles transpilation at runtime. If a build step is added later, switch to `module: "ESNext"` with a bundler.
