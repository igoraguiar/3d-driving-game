import * as THREE from "three";
import { CONFIG } from "./config";

// ─── SCENE SETUP ─────────────────────────────────────────────

export const canvas = document.getElementById("c") as HTMLCanvasElement;

export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(CONFIG.fogColor, 0.004);

export const camera = new THREE.PerspectiveCamera(
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
