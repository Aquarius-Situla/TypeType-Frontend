import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  TorusGeometry,
} from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import { BOTTOM_DROP, HALL, PLATFORM_X, STAIRS } from "../corridor/stairs-layout";

export type HallAbyss = { group: Group; dispose: () => void };

const BOTTOM = -CORRIDOR.floor - BOTTOM_DROP;
const RADIUS = HALL.screenRadius + 60;
const LEDGES = 14;
const LEDGE_GAP = 380;
const FIRST_LEDGE = BOTTOM - 260;
const RIBS = 28;
const LAMPS = 36;
const DOME = [0.97, 0.9, 0.78, 0.6];
const DOME_BASE = BOTTOM + HALL.screenLift + HALL.screenHeight / 2 + 120;
const STEEL = new Color(0x6f7b86);
const LAMP = new Color(0xffc98a);

const fading = (depth: number): number => Math.exp(-depth / 3.2);

export function createHallAbyss(): HallAbyss {
  const group = new Group();
  group.position.set(PLATFORM_X, 0, STAIRS.doorZ);
  const disposables: { dispose: () => void }[] = [];
  const ring = (radius: number, y: number, brightness: number, tube: number): void => {
    const geometry = new TorusGeometry(radius, tube, 6, 160);
    geometry.rotateX(Math.PI / 2);
    const material = new MeshBasicMaterial({
      color: STEEL.clone().multiplyScalar(brightness),
      fog: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.y = y;
    group.add(mesh);
    disposables.push(geometry, material);
  };
  for (let k = 0; k < LEDGES; k += 1)
    ring(RADIUS, FIRST_LEDGE - k * LEDGE_GAP, 0.55 * fading(k), 9);
  DOME.forEach((scale, j) => {
    ring(RADIUS * scale, DOME_BASE + j * 340, 0.32 * fading(j * 1.5), 7);
  });

  const ribGeometry = new BoxGeometry(10, LEDGE_GAP, 10);
  const ribMaterial = new MeshBasicMaterial({ fog: false });
  const ribs = new InstancedMesh(ribGeometry, ribMaterial, RIBS * LEDGES);
  const lampGeometry = new BoxGeometry(9, 9, 9);
  const lampMaterial = new MeshBasicMaterial({ fog: false, toneMapped: false });
  const lamps = new InstancedMesh(lampGeometry, lampMaterial, LAMPS * LEDGES);
  const place = new Matrix4();
  for (let k = 0; k < LEDGES; k += 1) {
    const top = FIRST_LEDGE - k * LEDGE_GAP;
    for (let i = 0; i < RIBS; i += 1) {
      const angle = (i / RIBS) * Math.PI * 2;
      place.makeTranslation(
        Math.cos(angle) * RADIUS,
        top - LEDGE_GAP / 2,
        Math.sin(angle) * RADIUS,
      );
      ribs.setMatrixAt(k * RIBS + i, place);
      ribs.setColorAt(k * RIBS + i, STEEL.clone().multiplyScalar(0.4 * fading(k + 0.5)));
    }
    for (let i = 0; i < LAMPS; i += 1) {
      const angle = ((i + 0.5 * (k % 2)) / LAMPS) * Math.PI * 2;
      const r = RADIUS - 14;
      place.makeTranslation(Math.cos(angle) * r, top - 14, Math.sin(angle) * r);
      lamps.setMatrixAt(k * LAMPS + i, place);
      const flicker = 0.55 + 0.45 * Math.abs(Math.sin(i * 12.9898 + k * 78.233));
      lamps.setColorAt(k * LAMPS + i, LAMP.clone().multiplyScalar(0.9 * flicker * fading(k)));
    }
  }
  group.add(ribs, lamps);
  disposables.push(ribGeometry, ribMaterial, lampGeometry, lampMaterial, ribs, lamps);

  return {
    group,
    dispose() {
      for (const item of disposables) item.dispose();
      group.removeFromParent();
    },
  };
}
