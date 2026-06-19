import * as THREE from "three";
import { CONFIG } from "./config";
import { camera, renderer, scene } from "./scene";
import { car, wheelMeshes } from "./car";
import { sceneryPools } from "./scenery";
import { roadGroup } from "./road";
import { updateCamera } from "./camera";
import { particles, updateParticles } from "./particles";
import type { SceneryPool } from "./types";

// ─── ANIMATION LOOP ─────────────────────────────────────────

const clock = new THREE.Clock();
let elapsed = 0;

function animate(): void {
	requestAnimationFrame(animate);
	const dt = Math.min(clock.getDelta(), 0.05);
	elapsed += dt;

	// ── Wheel rotation ──
	const wheelAngle = elapsed * CONFIG.speed * 0.8;
	wheelMeshes.forEach((w) => {
		w.children[0].rotation.x = wheelAngle; // tire
		w.children[1].rotation.x = wheelAngle; // rim
		// spokes rotate too since they're children
	});

	// ── Car body bob / subtle vibration ──
	const bobY = Math.sin(elapsed * CONFIG.bobFrequency) * CONFIG.bobAmplitude;
	const bobRoll =
		Math.sin(elapsed * CONFIG.bobFrequency * 0.7) * CONFIG.bobRollAmplitude;
	const bobPitch =
		Math.cos(elapsed * CONFIG.bobFrequency * 1.1) *
		CONFIG.bobRollAmplitude *
		0.5;

	car.position.y = bobY;
	car.rotation.z = bobRoll;
	car.rotation.x = bobPitch;

	// ── Update scenery pools ──
	Object.values(sceneryPools).forEach((pool: SceneryPool) => {
		pool.items.forEach((item: THREE.Group) => {
			item.position.z -= pool.speed * dt;

			// Reset when behind camera
			if (item.position.z < pool.zMin - 30) {
				item.position.z = pool.zMax + Math.random() * 30;

				// Re-randomize x position for variety
				if (pool === sceneryPools.trees || pool === sceneryPools.midGround) {
					const side = Math.random() > 0.5 ? -1 : 1;
					item.position.x =
						side * (CONFIG.roadWidth / 2 + 6 + Math.random() * 30);
				} else if (pool === sceneryPools.poles) {
					const side = Math.random() > 0.5 ? -1 : 1;
					item.position.x =
						side * (CONFIG.roadWidth / 2 + 1.5 + Math.random() * 2);
				} else if (pool === sceneryPools.nearGround) {
					const side = Math.random() > 0.5 ? -1 : 1;
					item.position.x =
						side * (CONFIG.roadWidth / 2 + 1 + Math.random() * 5);
				} else if (pool === sceneryPools.otherCars) {
					const lane = Math.random() > 0.5 ? -1 : 1;
					item.position.x = lane * (CONFIG.roadWidth / 2 - 2.5);
					item.rotation.y = lane === -1 ? 0 : Math.PI;
				} else if (pool === sceneryPools.clouds) {
					item.position.x = (Math.random() - 0.5) * 300;
					item.position.y = 40 + Math.random() * 30;
				}
			}
		});
	});

	// ── Road scrolling animation (subtle texture shift) ──
	// Move road elements for visual feedback
	roadGroup.children.forEach((child) => {
		if (child instanceof THREE.Group) {
			// dashed lines
			child.position.z -= CONFIG.speed * dt;
			if (child.position.z < -5) {
				child.position.z += 4.5 * 20; // reset forward
			}
		}
	});

	// ── Particles ──
	updateParticles(dt, elapsed);

	// ── Camera ──
	updateCamera(dt);

	// ── Render ──
	renderer.render(scene, camera);
}

// ─── RESIZE ──────────────────────────────────────────────────

window.addEventListener("resize", () => {
	const w = window.innerWidth;
	const h = window.innerHeight;
	camera.aspect = w / h;
	camera.updateProjectionMatrix();
	renderer.setSize(w, h);
});

// ─── START ───────────────────────────────────────────────────

export function start(): void {
	animate();
}
