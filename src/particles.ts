import * as THREE from "three";
import { CONFIG } from "./config";
import { scene } from "./scene";

// ─── DUST PARTICLES ─────────────────────────────────────────

const particleCount = 200;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleSizes = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
	particlePositions[i * 3] = (Math.random() - 0.5) * 20;
	particlePositions[i * 3 + 1] = Math.random() * 5;
	particlePositions[i * 3 + 2] = Math.random() * 60 - 10;
	particleSizes[i] = Math.random() * 3 + 1;
}

particleGeo.setAttribute(
	"position",
	new THREE.BufferAttribute(particlePositions, 3),
);
particleGeo.setAttribute("size", new THREE.BufferAttribute(particleSizes, 1));

const particleMat = new THREE.PointsMaterial({
	color: 0xddaa77,
	size: 0.15,
	transparent: true,
	opacity: 0.3,
	sizeAttenuation: true,
	fog: true,
});

export const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

export function updateParticles(dt: number, elapsed: number): void {
	const positions = particles.geometry.attributes.position
		.array as Float32Array;
	for (let i = 0; i < particleCount; i++) {
		positions[i * 3 + 2] -= CONFIG.speed * dt * 0.5;
		positions[i * 3 + 1] += Math.sin(elapsed * 2 + i) * 0.01;

		if (positions[i * 3 + 2] < -15) {
			positions[i * 3 + 2] = 50 + Math.random() * 20;
			positions[i * 3] = (Math.random() - 0.5) * 20;
			positions[i * 3 + 1] = Math.random() * 4;
		}
	}
	particles.geometry.attributes.position.needsUpdate = true;
}
