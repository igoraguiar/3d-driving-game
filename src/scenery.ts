import * as THREE from "three";
import { CONFIG } from "./config";
import { scene } from "./scene";
import type { CreateFn, PositionFn, SceneryPool, SceneryPools } from "./types";

// ─── PARALLAX SCENERY ────────────────────────────────────────

// Helper: create varied trees
function createTree(): THREE.Group {
	const group = new THREE.Group();
	const trunkH = 2 + Math.random() * 3;
	const trunkR = 0.12 + Math.random() * 0.1;
	const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.7, trunkR, trunkH, 8);
	const trunkMat = new THREE.MeshStandardMaterial({
		color: new THREE.Color().setHSL(
			0.07,
			0.4 + Math.random() * 0.3,
			0.15 + Math.random() * 0.1,
		),
		roughness: 0.9,
	});
	const trunk = new THREE.Mesh(trunkGeo, trunkMat);
	trunk.position.y = trunkH / 2;
	trunk.castShadow = true;
	group.add(trunk);

	// foliage layers
	const layers = 2 + Math.floor(Math.random() * 2);
	for (let l = 0; l < layers; l++) {
		const r = (1.2 + Math.random() * 1.0) * (1 - l * 0.2);
		const h = (1.0 + Math.random() * 0.5) * (1 - l * 0.15);
		const fGeo = new THREE.ConeGeometry(r, h, 8);
		const fMat = new THREE.MeshStandardMaterial({
			color: new THREE.Color().setHSL(
				0.25 + Math.random() * 0.1,
				0.5 + Math.random() * 0.3,
				0.15 + Math.random() * 0.1,
			),
			roughness: 0.85,
		});
		const foliage = new THREE.Mesh(fGeo, fMat);
		foliage.position.y = trunkH + l * h * 0.5 + 0.2;
		foliage.castShadow = true;
		group.add(foliage);
	}
	return group;
}

// Helper: create deciduous tree (rounded)
function createRoundTree(): THREE.Group {
	const group = new THREE.Group();
	const trunkH = 1.5 + Math.random() * 2;
	const trunkR = 0.1 + Math.random() * 0.08;
	const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.6, trunkR, trunkH, 8);
	const trunkMat = new THREE.MeshStandardMaterial({
		color: 0x5c3a1e,
		roughness: 0.9,
	});
	const trunk = new THREE.Mesh(trunkGeo, trunkMat);
	trunk.position.y = trunkH / 2;
	trunk.castShadow = true;
	group.add(trunk);

	const fGeo = new THREE.SphereGeometry(1.0 + Math.random() * 0.6, 8, 6);
	const fMat = new THREE.MeshStandardMaterial({
		color: new THREE.Color().setHSL(
			0.22 + Math.random() * 0.12,
			0.4 + Math.random() * 0.3,
			0.18 + Math.random() * 0.08,
		),
		roughness: 0.8,
	});
	const foliage = new THREE.Mesh(fGeo, fMat);
	foliage.position.y = trunkH + 0.6;
	foliage.castShadow = true;
	group.add(foliage);

	return group;
}

// Helper: create utility pole
function createPole(): THREE.Group {
	const group = new THREE.Group();
	const poleH = 5 + Math.random() * 1.5;
	const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, poleH, 8);
	const poleMat = new THREE.MeshStandardMaterial({
		color: 0x777777,
		roughness: 0.7,
		metalness: 0.3,
	});
	const pole = new THREE.Mesh(poleGeo, poleMat);
	pole.position.y = poleH / 2;
	pole.castShadow = true;
	group.add(pole);

	// cross arm
	const armGeo = new THREE.BoxGeometry(1.5, 0.08, 0.08);
	const arm = new THREE.Mesh(armGeo, poleMat);
	arm.position.y = poleH - 0.3;
	group.add(arm);

	// insulators
	const insGeo = new THREE.SphereGeometry(0.05, 6, 6);
	const insMat = new THREE.MeshStandardMaterial({
		color: 0xdddddd,
		roughness: 0.4,
	});
	[-0.5, 0.5].forEach((x) => {
		const ins = new THREE.Mesh(insGeo, insMat);
		ins.position.set(x, poleH - 0.25, 0);
		group.add(ins);
	});

	// light fixture (some poles)
	if (Math.random() > 0.4) {
		const lightGeo = new THREE.BoxGeometry(0.3, 0.08, 0.15);
		const lightMat = new THREE.MeshStandardMaterial({
			color: 0xffeecc,
			emissive: 0xffddaa,
			emissiveIntensity: 0.5,
		});
		const light = new THREE.Mesh(lightGeo, lightMat);
		light.position.set(0, poleH - 0.6, 0);
		group.add(light);
	}

	return group;
}

// Helper: create distant hill
function createHill(): THREE.Group {
	const group = new THREE.Group();
	const h = 8 + Math.random() * 18;
	const r = 15 + Math.random() * 25;
	const geo = new THREE.SphereGeometry(
		1,
		16,
		12,
		0,
		Math.PI * 2,
		0,
		Math.PI / 2,
	);
	const mat = new THREE.MeshStandardMaterial({
		color: new THREE.Color().setHSL(
			0.08 + Math.random() * 0.06,
			0.15 + Math.random() * 0.2,
			0.08 + Math.random() * 0.06,
		),
		roughness: 1.0,
		fog: true,
	});
	const hill = new THREE.Mesh(geo, mat);
	hill.scale.set(r, h, r * 0.7);
	hill.position.y = 0;
	hill.receiveShadow = true;
	group.add(hill);
	return group;
}

// Helper: create cloud
function createCloud(): THREE.Group {
	const group = new THREE.Group();
	const count = 3 + Math.floor(Math.random() * 4);
	const cloudMat = new THREE.MeshStandardMaterial({
		color: 0xffeedd,
		transparent: true,
		opacity: 0.6,
		roughness: 1.0,
	});
	for (let i = 0; i < count; i++) {
		const r = 2 + Math.random() * 4;
		const geo = new THREE.SphereGeometry(r, 8, 6);
		const puff = new THREE.Mesh(geo, cloudMat);
		puff.position.set(
			Math.random() * 8 - 4,
			Math.random() * 2 - 1,
			Math.random() * 4 - 2,
		);
		puff.scale.y = 0.4 + Math.random() * 0.3;
		group.add(puff);
	}
	return group;
}

// Helper: create bush / small roadside plant
function createBush(): THREE.Group {
	const group = new THREE.Group();
	const count = 2 + Math.floor(Math.random() * 3);
	for (let i = 0; i < count; i++) {
		const r = 0.3 + Math.random() * 0.5;
		const geo = new THREE.SphereGeometry(r, 8, 6);
		const mat = new THREE.MeshStandardMaterial({
			color: new THREE.Color().setHSL(
				0.25 + Math.random() * 0.1,
				0.4 + Math.random() * 0.3,
				0.15 + Math.random() * 0.1,
			),
			roughness: 0.85,
		});
		const bush = new THREE.Mesh(geo, mat);
		bush.position.set(
			Math.random() * 1 - 0.5,
			r * 0.6,
			Math.random() * 0.5 - 0.25,
		);
		bush.castShadow = true;
		group.add(bush);
	}
	return group;
}

// Helper: create a rock
function createRock(): THREE.Mesh {
	const r = 0.2 + Math.random() * 0.6;
	const geo = new THREE.DodecahedronGeometry(r, 0);
	const mat = new THREE.MeshStandardMaterial({
		color: new THREE.Color().setHSL(0, 0, 0.25 + Math.random() * 0.15),
		roughness: 0.9,
	});
	const rock = new THREE.Mesh(geo, mat);
	rock.rotation.set(Math.random(), Math.random(), Math.random());
	rock.scale.y = 0.5 + Math.random() * 0.5;
	rock.castShadow = true;
	return rock;
}

// Helper: create a small car (for passing/other vehicles)
function createSmallCar(): THREE.Group {
	const group = new THREE.Group();
	const color = new THREE.Color().setHSL(Math.random(), 0.5, 0.4);
	const mat = new THREE.MeshStandardMaterial({
		color,
		roughness: 0.3,
		metalness: 0.5,
	});

	const bodyGeo = new THREE.BoxGeometry(1.8, 0.6, 3.5);
	const body = new THREE.Mesh(bodyGeo, mat);
	body.position.y = 0.6;
	body.castShadow = true;
	group.add(body);

	const cabGeo = new THREE.BoxGeometry(1.5, 0.5, 1.6);
	const cab = new THREE.Mesh(cabGeo, mat);
	cab.position.y = 1.15;
	cab.position.z = 0.2;
	group.add(cab);

	const wGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12);
	const wMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
	const wheelCoords: [number, number, number][] = [
		[-0.85, 0.25, -1.1],
		[0.85, 0.25, -1.1],
		[-0.85, 0.25, 1.1],
		[0.85, 0.25, 1.1],
	];
	wheelCoords.forEach((p) => {
		const w = new THREE.Mesh(wGeo, wMat);
		w.rotation.z = Math.PI / 2;
		w.position.set(...p);
		group.add(w);
	});

	return group;
}

// ─── SCENERY POOLS ───────────────────────────────────────────

export const sceneryPools: SceneryPools = {
	nearGround: { items: [], speed: CONFIG.speed, zMin: -5, zMax: 30, count: 20 },
	trees: {
		items: [],
		speed: CONFIG.speed * 0.85,
		zMin: -20,
		zMax: 200,
		count: 16,
	},
	poles: {
		items: [],
		speed: CONFIG.speed * 0.85,
		zMin: -20,
		zMax: 200,
		count: 6,
	},
	midGround: {
		items: [],
		speed: CONFIG.speed * 0.6,
		zMin: -40,
		zMax: 250,
		count: 12,
	},
	farHills: {
		items: [],
		speed: CONFIG.speed * 0.15,
		zMin: -80,
		zMax: 350,
		count: 8,
	},
	clouds: {
		items: [],
		speed: CONFIG.speed * 0.05,
		zMin: -100,
		zMax: 300,
		count: CONFIG.cloudCount,
	},
	otherCars: {
		items: [],
		speed: CONFIG.speed * 0.3,
		zMin: -30,
		zMax: 180,
		count: 3,
	},
};

function initPool(
	pool: SceneryPool,
	createFn: CreateFn,
	positionFn: PositionFn,
): void {
	for (let i = 0; i < pool.count; i++) {
		const item = createFn();
		positionFn(item, i, pool.count);
		scene.add(item);
		pool.items.push(item as THREE.Group);
	}
}

// Near ground: bushes and rocks right beside the road
initPool(
	sceneryPools.nearGround,
	(): THREE.Group | THREE.Mesh => {
		return Math.random() > 0.5 ? createBush() : createRock();
	},
	(item: THREE.Object3D, i: number, total: number): void => {
		const side = i % 2 === 0 ? -1 : 1;
		const x = side * (CONFIG.roadWidth / 2 + 1 + Math.random() * 4);
		const z =
			(i / total) *
				(sceneryPools.nearGround.zMax - sceneryPools.nearGround.zMin) +
			sceneryPools.nearGround.zMin;
		item.position.set(x, 0, z);
	},
);

// Trees: left and right side, further from road
initPool(
	sceneryPools.trees,
	(): THREE.Group => {
		return Math.random() > 0.4 ? createTree() : createRoundTree();
	},
	(item: THREE.Object3D, i: number, total: number): void => {
		const side = Math.random() > 0.5 ? -1 : 1;
		const x = side * (CONFIG.roadWidth / 2 + 6 + Math.random() * 20);
		const z =
			(i / total) * (sceneryPools.trees.zMax - sceneryPools.trees.zMin) +
			sceneryPools.trees.zMin;
		item.position.set(x, 0, z);
		const s = 0.8 + Math.random() * 0.6;
		item.scale.set(s, s, s);
	},
);

// Poles along the road
initPool(
	sceneryPools.poles,
	createPole,
	(item: THREE.Object3D, i: number, total: number): void => {
		const side = i % 2 === 0 ? -1 : 1;
		const x = side * (CONFIG.roadWidth / 2 + 1.5 + Math.random() * 1.5);
		const z =
			(i / total) * (sceneryPools.poles.zMax - sceneryPools.poles.zMin) +
			sceneryPools.poles.zMin;
		item.position.set(x, 0, z);
	},
);

// Mid-ground: more trees and bushes
initPool(
	sceneryPools.midGround,
	(): THREE.Group => {
		const r = Math.random();
		if (r < 0.4) return createTree();
		if (r < 0.7) return createRoundTree();
		return createBush();
	},
	(item: THREE.Object3D, i: number, total: number): void => {
		const side = Math.random() > 0.5 ? -1 : 1;
		const x = side * (CONFIG.roadWidth / 2 + 15 + Math.random() * 30);
		const z =
			(i / total) *
				(sceneryPools.midGround.zMax - sceneryPools.midGround.zMin) +
			sceneryPools.midGround.zMin;
		item.position.set(x, 0, z);
		const s = 0.6 + Math.random() * 0.8;
		item.scale.set(s, s, s);
	},
);

// Far hills
initPool(
	sceneryPools.farHills,
	createHill,
	(item: THREE.Object3D, i: number, total: number): void => {
		const side = i % 2 === 0 ? -1 : 1;
		const x = side * (60 + Math.random() * 120);
		const z =
			(i / total) * (sceneryPools.farHills.zMax - sceneryPools.farHills.zMin) +
			sceneryPools.farHills.zMin;
		item.position.set(x, -3, z);
	},
);

// Clouds
initPool(
	sceneryPools.clouds,
	createCloud,
	(item: THREE.Object3D, i: number, total: number): void => {
		const x = (Math.random() - 0.5) * 300;
		const y = 40 + Math.random() * 30;
		const z =
			(i / total) * (sceneryPools.clouds.zMax - sceneryPools.clouds.zMin) +
			sceneryPools.clouds.zMin;
		item.position.set(x, y, z);
		const s = 0.5 + Math.random() * 1.0;
		item.scale.set(s, s, s);
	},
);

// Other cars
initPool(
	sceneryPools.otherCars,
	createSmallCar,
	(item: THREE.Object3D, i: number, total: number): void => {
		const lane = i % 2 === 0 ? -1 : 1;
		const x = lane * (CONFIG.roadWidth / 2 - 2.5);
		const z =
			(i / total) *
				(sceneryPools.otherCars.zMax - sceneryPools.otherCars.zMin) +
			sceneryPools.otherCars.zMin;
		item.position.set(x, 0, z);
		item.rotation.y = lane === -1 ? 0 : Math.PI;
	},
);
