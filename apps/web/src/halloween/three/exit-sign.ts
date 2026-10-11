import {
  Box3,
  CylinderGeometry,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  PointLight,
  Vector3,
} from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import { BOTTOM_DROP, HALL, STAIRS } from "../corridor/stairs-layout";

export type ExitSign = {
  group: Group;
  update: (now: number) => void;
  dispose: () => void;
};

const BOTTOM = -CORRIDOR.floor - BOTTOM_DROP;
const WIDTH = 64;
const GLOW = 700;
const SIGN_TOP = 256;
const EMISSIVE = 0.85;

function neonLevel(now: number): number {
  const slot = Math.floor(now / 140);
  const dropout = Math.sin(slot * 12.9898) * 43758.5453;
  return dropout - Math.floor(dropout) < 0.05 ? 0.15 : 0.92 + Math.random() * 0.08;
}

export function createExitSign(parent: Object3D, template: Object3D): ExitSign {
  const group = new Group();
  const fitting = template.clone(true);
  const glowing: MeshStandardMaterial[] = [];
  fitting.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const own = (material: Material): Material => {
      if (!(material instanceof MeshStandardMaterial)) return material;
      const lit = material.clone();
      lit.fog = false;
      glowing.push(lit);
      return lit;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map(own)
      : own(object.material);
  });
  const bounds = new Box3().setFromObject(fitting);
  const size = bounds.getSize(new Vector3());
  const centre = bounds.getCenter(new Vector3());
  fitting.scale.setScalar(WIDTH / size.z);
  fitting.position.set(
    -centre.x * fitting.scale.x,
    -bounds.max.y * fitting.scale.y,
    -centre.z * fitting.scale.z,
  );
  group.add(fitting);

  const x = HALL.doorwayX - 22;
  const y = BOTTOM + SIGN_TOP;
  group.position.set(x, y, STAIRS.doorZ);
  const rod = new CylinderGeometry(0.8, 0.8, STAIRS.headroom - SIGN_TOP, 6);
  const steel = new MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.5 });
  for (const side of [-1, 1]) {
    const hanger = new Mesh(rod, steel);
    hanger.position.set(0, (STAIRS.headroom - SIGN_TOP) / 2, side * WIDTH * 0.33);
    group.add(hanger);
  }
  const light = new PointLight(0x2bff7a, 0, 520, 2);
  light.position.set(x - 30, y - 30, STAIRS.doorZ);
  parent.add(light);

  return {
    group,
    update(now) {
      const level = neonLevel(now);
      for (const material of glowing) material.emissiveIntensity = EMISSIVE * level;
      light.intensity = GLOW * level;
    },
    dispose() {
      parent.remove(light);
      light.dispose();
      for (const material of glowing) material.dispose();
      rod.dispose();
      steel.dispose();
      group.removeFromParent();
    },
  };
}
