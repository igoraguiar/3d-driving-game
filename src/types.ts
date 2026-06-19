import type * as THREE from "three";

// ─── TYPES ───────────────────────────────────────────────────

export interface GameConfig {
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

export interface WheelPosition {
	x: number;
	y: number;
	z: number;
}

export interface SceneryPool {
	items: THREE.Group[];
	speed: number;
	zMin: number;
	zMax: number;
	count: number;
}

export interface SceneryPools {
	nearGround: SceneryPool;
	trees: SceneryPool;
	poles: SceneryPool;
	midGround: SceneryPool;
	farHills: SceneryPool;
	clouds: SceneryPool;
	otherCars: SceneryPool;
}

export interface CameraControls {
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

export type KeyState = Record<string, boolean>;
export type CreateFn = () => THREE.Object3D;
export type PositionFn = (
	item: THREE.Object3D,
	i: number,
	total: number,
) => void;
