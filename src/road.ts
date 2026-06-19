import * as THREE from "three";
import { CONFIG } from "./config";
import { scene } from "./scene";

// ─── ROAD ─────────────────────────────────────────────────────

export const roadGroup = new THREE.Group();
scene.add(roadGroup);

// road surface
const roadGeo = new THREE.PlaneGeometry(
	CONFIG.roadWidth,
	CONFIG.roadLength,
	1,
	40,
);
const roadMat = new THREE.MeshStandardMaterial({
	color: 0x333333,
	roughness: 0.85,
	metalness: 0.05,
});
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
roadGroup.add(road);

// road edges (white lines)
function makeRoadEdge(side: number): THREE.Mesh {
	const geo = new THREE.PlaneGeometry(0.25, CONFIG.roadLength, 1, 20);
	const mat = new THREE.MeshStandardMaterial({
		color: 0xeeeeee,
		roughness: 0.6,
	});
	const m = new THREE.Mesh(geo, mat);
	m.rotation.x = -Math.PI / 2;
	m.position.set((side * CONFIG.roadWidth) / 2, 0.01, 0);
	return m;
}
roadGroup.add(makeRoadEdge(-1));
roadGroup.add(makeRoadEdge(1));

// center dashed line
function makeDashLine(): THREE.Group {
	const group = new THREE.Group();
	const dashLen = 2.5;
	const gap = 2.0;
	const total = CONFIG.roadLength;
	let z = -total / 2;
	while (z < total / 2) {
		const segLen = Math.min(dashLen, total / 2 - z);
		const geo = new THREE.PlaneGeometry(0.18, segLen);
		const mat = new THREE.MeshStandardMaterial({
			color: 0xddaa33,
			roughness: 0.5,
		});
		const seg = new THREE.Mesh(geo, mat);
		seg.rotation.x = -Math.PI / 2;
		seg.position.set(0, 0.015, z + segLen / 2);
		group.add(seg);
		z += dashLen + gap;
	}
	return group;
}
roadGroup.add(makeDashLine());

// ground / grass on each side
function makeGroundSide(side: number): THREE.Mesh {
	const w = 120;
	const h = CONFIG.roadLength;
	const geo = new THREE.PlaneGeometry(w, h, 8, 20);
	const mat = new THREE.MeshStandardMaterial({
		color: side < 0 ? 0x3a6b2a : 0x2d5a1e,
		roughness: 1.0,
	});
	const m = new THREE.Mesh(geo, mat);
	m.rotation.x = -Math.PI / 2;
	m.position.set(side * (CONFIG.roadWidth / 2 + w / 2), -0.05, 0);
	m.receiveShadow = true;
	return m;
}
roadGroup.add(makeGroundSide(-1));
roadGroup.add(makeGroundSide(1));
