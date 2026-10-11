import {
  AdditiveBlending,
  Box3,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  PlaneGeometry,
  PointLight,
  type Scene,
  Vector3,
} from "three";
import { CORRIDOR } from "../corridor/corridor-config";

export type AlarmBeacons = {
  build: () => Group;
  update: (red: number, distance: number) => void;
  dispose: () => void;
};

const RED = 0xff0800;
const DIAMETER = 19;
const SPOT = 0.85;
const LIGHT = 5200;
const L = CORRIDOR.segmentLength;
const HANG = 14;

function glowTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,0.8)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.25)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  return new CanvasTexture(canvas);
}

function mounted(template: Object3D, inside: MeshStandardMaterial): Group {
  const model = template.clone(true);
  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.castShadow = false;
    if (object.name.includes("Inside")) object.material = inside;
  });
  model.rotation.x = Math.PI;
  const holder = new Group();
  holder.add(model);
  holder.updateMatrixWorld(true);
  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  model.scale.setScalar(DIAMETER / Math.max(size.x, size.z));
  holder.updateMatrixWorld(true);
  const placed = new Box3().setFromObject(model);
  const centre = placed.getCenter(new Vector3());
  model.position.set(-centre.x, -placed.max.y, -centre.z);
  return holder;
}

export function beaconZ(segment: number): number {
  return -segment * L - L * SPOT;
}

export function createAlarmBeacons(scene: Scene, template: Object3D): AlarmBeacons {
  let inside = new MeshStandardMaterial({ color: 0x3a0604 });
  template.traverse((object) => {
    if (object instanceof Mesh && object.name.includes("Inside")) {
      if (object.material instanceof MeshStandardMaterial) inside = object.material.clone();
    }
  });
  inside.emissive.setHex(RED);
  inside.emissiveIntensity = 0;
  inside.toneMapped = false;
  const map = glowTexture();
  const glow = new MeshBasicMaterial({
    map,
    color: RED,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  });
  const halo = new PlaneGeometry(70, 70);
  halo.rotateX(Math.PI / 2);
  halo.translate(0, -0.6, 0);
  for (const item of [inside, glow, halo]) item.userData.shared = true;
  const lights = [0, 1].map(() => {
    const light = new PointLight(RED, 0, 1100, 1.6);
    scene.add(light);
    return light;
  });

  return {
    build() {
      const group = mounted(template, inside);
      group.add(new Mesh(halo, glow));
      return group;
    },
    update(red, distance) {
      inside.emissiveIntensity = 2.2 * red;
      glow.opacity = 0.5 * red;
      const behind = Math.floor((distance - L * SPOT) / L);
      lights.forEach((light, i) => {
        light.position.set(0, CORRIDOR.ceiling - HANG - 10, beaconZ(Math.max(0, behind + i)));
        light.intensity = LIGHT * red;
      });
    },
    dispose() {
      for (const light of lights) {
        scene.remove(light);
        light.dispose();
      }
      inside.dispose();
      glow.dispose();
      halo.dispose();
      map.dispose();
    },
  };
}
