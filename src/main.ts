import * as THREE from "three";

// ─── TYPES ───────────────────────────────────────────────────

interface GameConfig {
	speed: number;
	roadWidth: number;
	roadLength: number;
	sceneryInterval: number;
	treeCount: number;
	hillCount: number;
	poleCount: number;
	cloudCount: number;
	fogNear: number;
	fogFar: number;
	bobFrequency: number;
	bobAmplitude: number;
	bobRollAmplitude: number;
	sunColor: number;
	skyTop: number;
	skyBottom: number;
	fogColor: number;
	ambientIntensity: number;
	dirIntensity: number;
}

interface WheelPosition {
	x: number;
	y: number;
	z: number;
}

interface SceneryPool {
	items: THREE.Group[];
	speed: number;
	zMin: number;
	zMax: number;
	count: number;
}

interface SceneryPools {
	nearGround: SceneryPool;
	trees: SceneryPool;
	poles: SceneryPool;
	midGround: SceneryPool;
	farHills: SceneryPool;
	clouds: SceneryPool;
	otherCars: SceneryPool;
}

interface CameraControls {
	basePosition: THREE.Vector3;
	position: THREE.Vector3;
	target: THREE.Vector3;
	lookTarget: THREE.Vector3;
	isDragging: boolean;
	prevMouse: { x: number; y: number };
	orbitX: number;
	orbitY: number;
	orbitRadius: number;
	offset: THREE.Vector3;
	zoom: number;
	orbitTarget: THREE.Vector3;
}

type KeyState = Record<string, boolean>;
type CreateFn = () => THREE.Object3D;
type PositionFn = (item: THREE.Object3D, i: number, total: number) => void;

// ─── CONFIG ──────────────────────────────────────────────────

const CONFIG: GameConfig = {
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

// ─── SCENE SETUP ─────────────────────────────────────────────

const canvas = document.getElementById("c") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(CONFIG.fogColor, 0.004);

const camera = new THREE.PerspectiveCamera(
	55,
	window.innerWidth / window.innerHeight,
	0.5,
	500,
);
camera.position.set(6, 3.5, 10);

// ─── GRADIENT SKY ────────────────────────────────────────────

(function createSky() {
	const skyGeo = new THREE.SphereGeometry(350, 32, 32);
	const skyMat = new THREE.ShaderMaterial({
		side: THREE.BackSide,
		fog: false,
		depthWrite: false,
		uniforms: {
			topColor: { value: new THREE.Color(CONFIG.skyTop) },
			bottomColor: { value: new THREE.Color(CONFIG.skyBottom) },
			offset: { value: 20 },
			exponent: { value: 0.4 },
		},
		vertexShader: `
  varying vec3 vWorldPosition;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPosition = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
		fragmentShader: `
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform float offset;
  uniform float exponent;
  varying vec3 vWorldPosition;
  void main() {
    float h = normalize(vWorldPosition + offset).y;
    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
  }
`,
	});
	scene.add(new THREE.Mesh(skyGeo, skyMat));
})();

// ─── SUN DISC ─────────────────────────────────────────────────

(function createSun() {
	const sunGeo = new THREE.CircleGeometry(18, 48);
	const sunMat = new THREE.MeshBasicMaterial({
		color: 0xffcc44,
		transparent: true,
		opacity: 0.9,
	});
	const sun = new THREE.Mesh(sunGeo, sunMat);
	sun.position.set(-60, 28, -180);
	sun.lookAt(camera.position);
	scene.add(sun);

	// glow
	const glowGeo = new THREE.CircleGeometry(35, 48);
	const glowMat = new THREE.MeshBasicMaterial({
		color: 0xff8844,
		transparent: true,
		opacity: 0.15,
	});
	const glow = new THREE.Mesh(glowGeo, glowMat);
	glow.position.copy(sun.position);
	glow.position.z -= 1;
	glow.lookAt(camera.position);
	scene.add(glow);
})();

// ─── LIGHTING ─────────────────────────────────────────────────

// r128 used arbitrary intensity units; r184+ uses physically-based (lux).
// Scale up to match the original look.
const ambientLight = new THREE.AmbientLight(
	0x556688,
	CONFIG.ambientIntensity * 2,
);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(
	CONFIG.sunColor,
	CONFIG.dirIntensity * 3,
);
sunLight.position.set(-30, 35, -20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 120;
sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.right = 30;
sunLight.shadow.camera.top = 20;
sunLight.shadow.camera.bottom = -5;
sunLight.shadow.bias = -0.001;
scene.add(sunLight);
scene.add(sunLight.target);

const hemiLight = new THREE.HemisphereLight(0xff9966, 0x443322, 0.35 * 2);
scene.add(hemiLight);

const backLight = new THREE.DirectionalLight(0x6688cc, 0.3 * 2);
backLight.position.set(10, 8, 15);
scene.add(backLight);

// ─── ROAD ─────────────────────────────────────────────────────

const roadGroup = new THREE.Group();
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

// ─── CAR ──────────────────────────────────────────────────────

const car = new THREE.Group();
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
	car.add(tl);
});

// ── Wheels ──
const wheelMeshes: THREE.Group[] = [];
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

const sceneryPools: SceneryPools = {
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

// ─── CAMERA CONTROLS ──────────────────────────────────────────

const cameraControls: CameraControls = {
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

function updateCameraKeyboard(dt: number): void {
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
}

// ─── ROAD TEXTURE ANIMATION ─────────────────────────────────

const _roadOffset = { value: 0 };

function _updateRoadTexture(time: number): void {
	const offset = (time * CONFIG.speed * 0.02) % 1;
	// Animate each road element
	roadGroup.children.forEach((child) => {
		if (child instanceof THREE.Mesh && child.material.map) {
			child.material.map.offset.y = offset;
		}
	});
	// Animate dashed lines
	roadGroup.children.forEach((child) => {
		if (child instanceof THREE.Group) {
			child.position.z = -(time * CONFIG.speed) % 5;
		}
	});
}

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

const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

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

	// ── Camera ──
	updateCameraKeyboard(dt);
	updateCameraFromOrbit();

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

animate();
