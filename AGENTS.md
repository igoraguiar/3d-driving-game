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
| Bundling | `bun build` (production), none (dev) |

## Directory Map

```
├── index.html        # Entry point; loads src/main.ts as ES module
├── src/
│   ├── main.ts       # Entry — imports all modules, calls start()
│   ├── types.ts      # Shared interfaces (GameConfig, SceneryPool, etc.)
│   ├── config.ts     # CONFIG constant (tunable game parameters)
│   ├── scene.ts      # Renderer, scene, camera, sky, sun, lighting
│   ├── road.ts       # Road group (surface, lines, grass)
│   ├── car.ts        # Car model + wheelMeshes (procedural geometry)
│   ├── scenery.ts    # Factory functions + object-pooled parallax layers
│   ├── camera.ts     # Camera controls (mouse orbit, WASD, touch, zoom)
│   ├── particles.ts  # Dust particle system (PointsMaterial)
│   └── loop.ts       # animate() loop + resize handler (orchestrator)
├── style.css         # Minimal overlay styles
├── dist/             # Production build output (git-ignored)
├── tsconfig.json     # TypeScript config (strict, noEmit)
├── package.json      # Dependencies + scripts
└── PROMPT.md         # Original design brief
```

**Module dependency graph (no circular deps):**

```
types ← config ← scene ←──┬→ road
                          ├──→ car
                          ├──→ camera
                          └──→ particles
{types, config, scene} → scenery
{all modules}          → loop ← main.ts
```

**`loop.ts` orchestrates the game loop**, calling `update(dt)` on each subsystem:

- Wheel rotation + car body bob → `car.ts`
- Scenery pool recycling → `scenery.ts`
- Road dash scrolling → `road.ts`
- Particle update → `particles.ts`
- Camera orbit + WASD → `camera.ts`
- Final render → `scene.ts`

## Commands

```bash
bun install          # Install dependencies (three + @types/three)
bun run dev          # Start dev server (opens index.html in browser)
bun run typecheck    # Run TypeScript type checker (no emit)
bun run build        # Bundle production build to dist/
```

No test runner or linter is configured. Add one before introducing complex refactors.

## Rules of Engagement

### ✅ Always

- Keep `CONFIG` in `src/config.ts` as the single source of tunable values.
- Define interfaces in `src/types.ts` and import where needed.
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
- Commit `node_modules/`, `.env`, or `dist/` (`.gitignore` covers all three).
- Inline-create geometry or materials inside the `animate()` loop (causes GC pressure).
- Use `innerHTML` or inline event handlers in HTML.
- Add inline CSS styles to elements; extend `style.css` instead.
- Introduce circular dependencies between modules. If two modules need each other, extract the shared types into `types.ts`.
- Add side effects to modules imported only for types — use `import type { … }` instead.

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

- `scenery.ts` is the largest module (~300 lines). If it grows beyond 400 lines, split factories into `scenery/factories.ts`.
- `car.ts` could export a `buildCar()` function instead of a module-level singleton, enabling multiple cars or scene presets.
- `bun build` handles production bundling. The output in `dist/` is a single bundled JS file (~930KB with Three.js inlined). For code splitting or tree shaking, consider Vite or esbuild.
