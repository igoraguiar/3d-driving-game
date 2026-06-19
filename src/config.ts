import type { GameConfig } from "./types";

// ─── CONFIG ──────────────────────────────────────────────────

export const CONFIG: GameConfig = {
	speed: 40,
	roadWidth: 10,
	roadLength: 400,
	sceneryInterval: 120,
	treeCount: 3,
	hillCount: 6,
	poleCount: 2,
	cloudCount: 8,
	fogNear: 60,
	fogFar: 280,
	bobFrequency: 3.2,
	bobAmplitude: 0.018,
	bobRollAmplitude: 0.004,
	sunColor: 0xff6a3a,
	skyTop: 0x1a1040,
	skyBottom: 0xff7744,
	fogColor: 0xcc8855,
	ambientIntensity: 0.5,
	dirIntensity: 1.2,
};
