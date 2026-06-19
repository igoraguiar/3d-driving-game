// ─── 3D DRIVING GAME ─────────────────────────────────────────
// Entry point — imports all modules and kicks off the game loop.
//
// Module dependency order (no circular deps):
//   types → config → scene → { road, car, camera, particles }
//   { types, config, scene } → scenery
//   { all above } → loop

import "./scene";
import "./road";
import "./car";
import "./scenery";
import "./camera";
import "./particles";
import { start } from "./loop";

start();
