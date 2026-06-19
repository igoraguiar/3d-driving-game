import * as THREE from "three";
import { camera, canvas } from "./scene";
import type { CameraControls, KeyState } from "./types";

// ─── CAMERA CONTROLS ──────────────────────────────────────────

export const cameraControls: CameraControls = {
	basePosition: new THREE.Vector3(6, 3.5, 10),
	position: new THREE.Vector3(6, 3.5, 10),
	target: new THREE.Vector3(0, 1, 0),
	lookTarget: new THREE.Vector3(0, 1, 0),

	// Mouse orbit
	isDragging: false,
	prevMouse: { x: 0, y: 0 },
	orbitX: Math.PI, // horizontal angle
	orbitY: 0.25, // vertical angle
	orbitRadius: Math.sqrt(6 * 6 + 3.5 * 3.5 + 10 * 10),

	// WASD offset
	offset: new THREE.Vector3(0, 0, 0),

	// Zoom
	zoom: 1.0,

	orbitTarget: new THREE.Vector3(0, 1, 0),
};

function updateCameraFromOrbit(): void {
	const cc = cameraControls;
	const r = cc.orbitRadius / cc.zoom;
	const x = cc.orbitTarget.x + r * Math.sin(cc.orbitX) * Math.cos(cc.orbitY);
	const y = cc.orbitTarget.y + r * Math.sin(cc.orbitY);
	const z = cc.orbitTarget.z + r * Math.cos(cc.orbitX) * Math.cos(cc.orbitY);
	camera.position.set(x, y, z);
	camera.lookAt(cc.orbitTarget);
}

// Mouse events
canvas.addEventListener("mousedown", (e: MouseEvent) => {
	cameraControls.isDragging = true;
	cameraControls.prevMouse.x = e.clientX;
	cameraControls.prevMouse.y = e.clientY;
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
	if (!cameraControls.isDragging) return;
	const dx = e.clientX - cameraControls.prevMouse.x;
	const dy = e.clientY - cameraControls.prevMouse.y;
	cameraControls.orbitX -= dx * 0.005;
	cameraControls.orbitY = Math.max(
		-0.3,
		Math.min(1.2, cameraControls.orbitY + dy * 0.005),
	);
	cameraControls.prevMouse.x = e.clientX;
	cameraControls.prevMouse.y = e.clientY;
});

canvas.addEventListener("mouseup", () => {
	cameraControls.isDragging = false;
});
canvas.addEventListener("mouseleave", () => {
	cameraControls.isDragging = false;
});

// Scroll zoom
canvas.addEventListener(
	"wheel",
	(e: WheelEvent) => {
		e.preventDefault();
		cameraControls.zoom = Math.max(
			0.5,
			Math.min(3.0, cameraControls.zoom + e.deltaY * 0.001),
		);
	},
	{ passive: false },
);

// Touch support
canvas.addEventListener("touchstart", (e: TouchEvent) => {
	if (e.touches.length === 1) {
		cameraControls.isDragging = true;
		cameraControls.prevMouse.x = e.touches[0].clientX;
		cameraControls.prevMouse.y = e.touches[0].clientY;
	}
});

canvas.addEventListener(
	"touchmove",
	(e: TouchEvent) => {
		if (!cameraControls.isDragging || e.touches.length !== 1) return;
		e.preventDefault();
		const dx = e.touches[0].clientX - cameraControls.prevMouse.x;
		const dy = e.touches[0].clientY - cameraControls.prevMouse.y;
		cameraControls.orbitX -= dx * 0.005;
		cameraControls.orbitY = Math.max(
			-0.3,
			Math.min(1.2, cameraControls.orbitY + dy * 0.005),
		);
		cameraControls.prevMouse.x = e.touches[0].clientX;
		cameraControls.prevMouse.y = e.touches[0].clientY;
	},
	{ passive: false },
);

canvas.addEventListener("touchend", () => {
	cameraControls.isDragging = false;
});

// Keyboard
const keys: KeyState = {};
window.addEventListener("keydown", (e: KeyboardEvent) => {
	keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", (e: KeyboardEvent) => {
	keys[e.key.toLowerCase()] = false;
});

export function updateCamera(dt: number): void {
	const speed = 15 * dt;
	const forward = new THREE.Vector3();
	camera.getWorldDirection(forward);
	forward.y = 0;
	forward.normalize();

	const right = new THREE.Vector3();
	right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

	if (keys["w"]) cameraControls.orbitTarget.addScaledVector(forward, -speed);
	if (keys["s"]) cameraControls.orbitTarget.addScaledVector(forward, speed);
	if (keys["a"]) cameraControls.orbitTarget.addScaledVector(right, speed);
	if (keys["d"]) cameraControls.orbitTarget.addScaledVector(right, -speed);
	if (keys["q"])
		cameraControls.orbitRadius = Math.max(
			5,
			cameraControls.orbitRadius - speed,
		);
	if (keys["e"])
		cameraControls.orbitRadius = Math.min(
			40,
			cameraControls.orbitRadius + speed,
		);

	updateCameraFromOrbit();
}
