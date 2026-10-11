import {
  Box3,
  BoxGeometry,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  PlaneGeometry,
  Vector3,
} from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import { SEAL_RISE_MS, STAIRS, STAIRS_TOP_X } from "../corridor/stairs-layout";

export type Seal = {
  group: Group;
  start: (now: number) => void;
  update: (now: number) => void;
  dispose: () => void;
};

const FLOOR = -CORRIDOR.floor;
const LENGTH = 170;
const WIDTH = STAIRS.width * 1.9;
const HEIGHT = STAIRS.headroom * 2.3;
const CENTRE_X = STAIRS_TOP_X - LENGTH / 2 + 34;
const LINTEL_HEIGHT = 90;
const CORE_LENGTH = 120;
const CORE_WIDTH = STAIRS.width + 80;
const STONE = 0x8a8680;

export function createSeal(rock: Object3D, dark: Material, bedrock: Material): Seal {
  const group = new Group();
  group.name = "seal";
  group.visible = false;

  const slab = rock.clone(true);
  const tone = (material: Material): Material => {
    if (!(material instanceof MeshStandardMaterial)) return material;
    const toned = material.clone();
    toned.color.setHex(STONE);
    toned.side = DoubleSide;
    return toned;
  };
  slab.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.material = Array.isArray(object.material)
      ? object.material.map(tone)
      : tone(object.material);
    object.castShadow = true;
    object.receiveShadow = true;
  });
  slab.rotation.y = Math.PI / 2;
  const turned = new Group();
  turned.add(slab);
  turned.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(turned);
  const size = bounds.getSize(new Vector3());
  const centre = bounds.getCenter(new Vector3());
  turned.scale.set(LENGTH / size.x, HEIGHT / size.y, WIDTH / size.z);
  turned.position.set(
    -centre.x * turned.scale.x,
    -bounds.min.y * turned.scale.y,
    -centre.z * turned.scale.z,
  );
  const coreGeometry = new BoxGeometry(CORE_LENGTH, HEIGHT, CORE_WIDTH);
  const uv = coreGeometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * 1.4, uv.getY(i) * 3.5);
  coreGeometry.translate(STAIRS_TOP_X - 2 - CORE_LENGTH / 2 - CENTRE_X, HEIGHT / 2, 0);
  const core = new Mesh(coreGeometry, bedrock);
  core.receiveShadow = true;
  const holder = new Group();
  holder.add(turned, core);
  holder.position.set(CENTRE_X, FLOOR - HEIGHT, STAIRS.doorZ);

  const backLength = 60;
  const backGeometry = new BoxGeometry(backLength, HEIGHT, STAIRS.width + 40);
  backGeometry.translate(0, HEIGHT / 2, 0);
  const back = new Mesh(backGeometry, dark);
  back.position.set(STAIRS.doorX + backLength / 2 + 4, FLOOR - 30, STAIRS.doorZ);
  back.scale.y = 0.001;
  const lintelGeometry = new PlaneGeometry(STAIRS.width + 60, LINTEL_HEIGHT);
  const lintel = new Mesh(lintelGeometry, dark);
  lintel.rotation.y = Math.PI / 2;
  lintel.position.set(STAIRS_TOP_X - 0.5, FLOOR + 272 + LINTEL_HEIGHT / 2, STAIRS.doorZ);
  group.add(holder, back, lintel);
  let startedAt: number | null = null;

  return {
    group,
    start(now) {
      if (startedAt !== null) return;
      startedAt = now;
      group.visible = true;
    },
    update(now) {
      if (startedAt === null) return;
      const t = Math.min(1, (now - startedAt) / SEAL_RISE_MS);
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const grind = t < 1 ? (Math.random() - 0.5) * 1.6 : 0;
      holder.position.y = FLOOR - HEIGHT + (HEIGHT - 30) * eased;
      back.scale.y = eased > 0.92 ? 1 : 0.001;
      holder.position.z = STAIRS.doorZ + grind;
    },
    dispose() {
      backGeometry.dispose();
      coreGeometry.dispose();
      lintelGeometry.dispose();
      slab.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      });
      group.removeFromParent();
    },
  };
}
