import * as THREE from "three";
import type { WheelPosition } from "./types";
import { scene } from "./scene";

// ─── CAR ──────────────────────────────────────────────────────

export const car = new THREE.Group();
car.position.set(0, 0, 0);
car.rotation.y = Math.PI;
scene.add(car);

// Materials
const bodyMat = new THREE.MeshStandardMaterial({
	color: 0xcc2222,
	roughness: 0.25,
	metalness: 0.6,
});
const darkMat = new THREE.MeshStandardMaterial({
	color: 0x111111,
	roughness: 0.7,
	metalness: 0.3,
});
const glassMat = new THREE.MeshStandardMaterial({
	color: 0x88aacc,
	roughness: 0.05,
	metalness: 0.1,
	transparent: true,
	opacity: 0.5,
});
const chromeMat = new THREE.MeshStandardMaterial({
	color: 0xcccccc,
	roughness: 0.05,
	metalness: 0.95,
});
const headlightMat = new THREE.MeshStandardMaterial({
	color: 0xffffee,
	emissive: 0xffffcc,
	emissiveIntensity: 2.0,
	roughness: 0.3,
});
const taillightMat = new THREE.MeshStandardMaterial({
	color: 0xff2200,
	emissive: 0xff2200,
	emissiveIntensity: 1.5,
	roughness: 0.4,
});
const wheelMat = new THREE.MeshStandardMaterial({
	color: 0x222222,
	roughness: 0.6,
	metalness: 0.2,
});
const rimMat = new THREE.MeshStandardMaterial({
	color: 0xaaaaaa,
	roughness: 0.15,
	metalness: 0.9,
});

// ── Lower body (main chassis) ──
const lowerBody = new THREE.Group();
// main box
const lbGeo = new THREE.BoxGeometry(2.1, 0.65, 4.8);
const lbMesh = new THREE.Mesh(lbGeo, bodyMat);
lbMesh.castShadow = true;
lowerBody.add(lbMesh);

// front bumper
const frontBumpGeo = new THREE.BoxGeometry(2.2, 0.35, 0.3);
const frontBump = new THREE.Mesh(frontBumpGeo, darkMat);
frontBump.position.set(0, -0.15, -2.55);
frontBump.castShadow = true;
lowerBody.add(frontBump);

// rear bumper
const rearBump = new THREE.Mesh(frontBumpGeo, darkMat);
rearBump.position.set(0, -0.15, 2.55);
rearBump.castShadow = true;
lowerBody.add(rearBump);

// hood slope
const hoodGeo = new THREE.BoxGeometry(2.0, 0.12, 1.2);
const hood = new THREE.Mesh(hoodGeo, bodyMat);
hood.position.set(0, 0.38, -1.6);
hood.rotation.x = 0.12;
hood.castShadow = true;
lowerBody.add(hood);

// trunk slope
const trunkGeo = new THREE.BoxGeometry(2.0, 0.1, 0.8);
const trunk = new THREE.Mesh(trunkGeo, bodyMat);
trunk.position.set(0, 0.36, 1.9);
trunk.rotation.x = -0.15;
trunk.castShadow = true;
lowerBody.add(trunk);

// grille
const grilleGeo = new THREE.BoxGeometry(1.4, 0.25, 0.05);
const grille = new THREE.Mesh(grilleGeo, darkMat);
grille.position.set(0, -0.05, -2.42);
lowerBody.add(grille);

// chrome strips
const stripGeo = new THREE.BoxGeometry(2.15, 0.04, 4.82);
const strip = new THREE.Mesh(stripGeo, chromeMat);
strip.position.y = -0.15;
lowerBody.add(strip);

car.add(lowerBody);
lowerBody.position.y = 0.7;

// ── Cabin (upper body / greenhouse) ──
const cabin = new THREE.Group();

// main cabin box
const cabGeo = new THREE.BoxGeometry(1.85, 0.7, 2.2);
const cabMesh = new THREE.Mesh(cabGeo, bodyMat);
cabMesh.castShadow = true;
cabin.add(cabMesh);

// roof
const roofGeo = new THREE.BoxGeometry(1.82, 0.08, 2.1);
const roofMesh = new THREE.Mesh(roofGeo, bodyMat);
roofMesh.position.y = 0.39;
roofMesh.castShadow = true;
cabin.add(roofMesh);

// windshield (front glass)
const windGeo = new THREE.PlaneGeometry(1.7, 0.65);
const windMesh = new THREE.Mesh(windGeo, glassMat);
windMesh.position.set(0, 0.15, -1.1);
windMesh.rotation.x = 0.35;
cabin.add(windMesh);

// rear window
const rearWindGeo = new THREE.PlaneGeometry(1.6, 0.6);
const rearWindMesh = new THREE.Mesh(rearWindGeo, glassMat);
rearWindMesh.position.set(0, 0.15, 1.1);
rearWindMesh.rotation.x = -0.35;
cabin.add(rearWindMesh);

// side windows
const sideWinGeo = new THREE.PlaneGeometry(1.0, 0.55);
[-1, 1].forEach((side) => {
	const sw = new THREE.Mesh(sideWinGeo, glassMat);
	sw.position.set(side * 0.93, 0.15, 0);
	sw.rotation.y = (side * Math.PI) / 2;
	cabin.add(sw);
});

car.add(cabin);
cabin.position.y = 1.35;

// ── Headlights ──
const hlGeo = new THREE.SphereGeometry(0.12, 12, 8);
[-0.65, 0.65].forEach((x) => {
	const hl = new THREE.Mesh(hlGeo, headlightMat);
	hl.position.set(x, 0.7, -2.45);
	car.add(hl);
});

// ── Taillights ──
const tlGeo = new THREE.BoxGeometry(0.5, 0.15, 0.05);
[-0.65, 0.65].forEach((x) => {
	const tl = new THREE.Mesh(tlGeo, taillightMat);
	tl.position.set(x, 0.65, 2.5);
	tl.add(tl);
});

// ── Wheels ──
export const wheelMeshes: THREE.Group[] = [];
const wheelPositions: WheelPosition[] = [
	{ x: -1.0, y: 0, z: -1.5 }, // front-left
	{ x: 1.0, y: 0, z: -1.5 }, // front-right
	{ x: -1.0, y: 0, z: 1.5 }, // rear-left
	{ x: 1.0, y: 0, z: 1.5 }, // rear-right
];

wheelPositions.forEach((pos) => {
	const wheelGroup = new THREE.Group();

	// tire
	const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 24);
	const tire = new THREE.Mesh(tireGeo, wheelMat);
	tire.rotation.z = Math.PI / 2;
	tire.castShadow = true;
	wheelGroup.add(tire);

	// rim disc
	const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 16);
	const rim = new THREE.Mesh(rimGeo, rimMat);
	rim.rotation.z = Math.PI / 2;
	wheelGroup.add(rim);

	// hubcap / spokes visual
	const spokeGeo = new THREE.BoxGeometry(0.45, 0.04, 0.04);
	for (let s = 0; s < 5; s++) {
		const spoke = new THREE.Mesh(spokeGeo, rimMat);
		spoke.rotation.x = (s / 5) * Math.PI;
		spoke.position.z = 0;
		wheelGroup.add(spoke);
	}

	// second spoke set (crossed)
	const spoke2Geo = new THREE.BoxGeometry(0.04, 0.45, 0.04);
	for (let s = 0; s < 5; s++) {
		const spoke2 = new THREE.Mesh(spoke2Geo, rimMat);
		spoke2.rotation.x = (s / 5) * Math.PI;
		wheelGroup.add(spoke2);
	}

	wheelGroup.position.set(pos.x, pos.y + 0.38, pos.z);
	car.add(wheelGroup);
	wheelMeshes.push(wheelGroup);
});

// ── Side mirrors ──
const mirrorGeo = new THREE.BoxGeometry(0.15, 0.1, 0.08);
[-1, 1].forEach((side) => {
	const mirror = new THREE.Mesh(mirrorGeo, bodyMat);
	mirror.position.set(side * 1.1, 1.45, -0.6);
	car.add(mirror);
});

// ── Exhaust pipe ──
const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8);
const exhaust = new THREE.Mesh(exhaustGeo, darkMat);
exhaust.rotation.x = Math.PI / 2;
exhaust.position.set(0.6, 0.35, 2.65);
car.add(exhaust);

// ── Antenna ──
const antGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6);
const ant = new THREE.Mesh(antGeo, darkMat);
ant.position.set(-0.6, 1.95, 0.6);
car.add(ant);

// ── License plate ──
const plateGeo = new THREE.BoxGeometry(0.6, 0.2, 0.02);
const plateMat = new THREE.MeshStandardMaterial({
	color: 0xeeeeff,
	roughness: 0.5,
});
const plate = new THREE.Mesh(plateGeo, plateMat);
plate.position.set(0, 0.6, 2.57);
car.add(plate);
