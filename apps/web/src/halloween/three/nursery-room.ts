import {
  Box3,
  Group,
  Mesh,
  type Object3D,
  PlaneGeometry,
  PointLight,
  type Scene,
  ShaderMaterial,
  SpotLight,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
} from "three";
import { NURSERY, type NurseryPhase } from "../corridor/nursery";
import { createLightShaft } from "./light-shaft";
import type { CorridorMaterials } from "./materials";
import { instance, type ModelTemplates } from "./models";
import { box, wallPiece } from "./pieces";
import { tvFaceShader } from "./tv-face-shader";

export type NurseryView = { phase: NurseryPhase; since: number };

export type NurseryRoom = {
  update: (view: NurseryView | null, now: number) => void;
  dispose: () => void;
};

const { origin, width, depth, height } = NURSERY;
const FLOOR = origin.y - 190;
const CRIB_LIGHT = 12000;
const TV_LIGHT = 4200;
const SHAFT_HEIGHT = 2600;
const SHAFT_GLOW = 0.55;

function fitted(template: Object3D, length: number): Group {
  const model = template.clone(true);
  const holder = new Group();
  holder.add(model);
  holder.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(model);
  const size = bounds.getSize(new Vector3());
  model.scale.setScalar(length / Math.max(size.x, size.z));
  holder.updateMatrixWorld(true);
  const placed = new Box3().setFromObject(model);
  const centre = placed.getCenter(new Vector3());
  model.position.set(-centre.x, -placed.min.y, -centre.z);
  return holder;
}

function ground(materials: CorridorMaterials): Mesh {
  const floor = wallPiece(width, depth, [0, width / 220], [0, depth / 220], materials.wood);
  floor.rotation.x = -Math.PI / 2;
  return floor;
}

export function createNurseryRoom(
  scene: Scene,
  models: ModelTemplates,
  materials: CorridorMaterials,
  face: Texture,
): NurseryRoom {
  const group = new Group();
  group.position.set(origin.x, FLOOR, origin.z);
  const crib = fitted(models.crib, 125);
  crib.position.set(0, 0, -NURSERY.crib);
  crib.rotation.y = Math.PI / 2;
  const tvX = NURSERY.tv.x;
  const tvZ = -NURSERY.tv.along;
  const stand = box(62, 112, 120, materials.darkWood);
  stand.position.set(tvX, 56, tvZ);
  const television = instance(models.television, 2.3);
  television.position.set(tvX, 112, tvZ);
  television.rotation.y = Math.atan2(-tvX, NURSERY.tv.along - NURSERY.crib + 140);
  const screenMaterial = new ShaderMaterial({
    ...tvFaceShader,
    uniforms: { face: { value: face }, time: { value: 0 }, power: { value: 0 } },
    toneMapped: false,
    fog: false,
  });
  const screen = new Mesh(new PlaneGeometry(0.31, 0.25), screenMaterial);
  screen.position.set(0, 0.254, 0.126);
  television.add(screen);
  group.add(ground(materials), crib, stand, television);
  scene.add(group);

  const cribLight = new SpotLight(0xcbd6e8, 0, 1200, 0.62, 0.75, 1.2);
  cribLight.position.set(origin.x, FLOOR + height - 6, origin.z - NURSERY.crib);
  cribLight.target.position.set(origin.x, FLOOR, origin.z - NURSERY.crib);
  const tvLight = new PointLight(0x9fb4ff, 0, 1100, 1.4);
  const facing = television.rotation.y;
  tvLight.position.set(
    origin.x + tvX + Math.sin(facing) * 120,
    FLOOR + 170,
    origin.z + tvZ + Math.cos(facing) * 120,
  );
  const shaft = createLightShaft(60, 190, SHAFT_HEIGHT);
  shaft.mesh.position.set(0, SHAFT_HEIGHT / 2, -NURSERY.crib);
  group.add(shaft.mesh);
  scene.add(cribLight, cribLight.target, tvLight);

  return {
    update(view, now) {
      const lit = view !== null && ["room", "emptied", "creaking"].includes(view.phase);
      const flicker = 0.92 + Math.sin(now / 37) * 0.03 + Math.random() * 0.05;
      cribLight.intensity = lit ? CRIB_LIGHT * flicker : 0;
      shaft.set(lit ? SHAFT_GLOW * flicker : 0);
      const tvOn = view !== null && ["empty", "sinking", "dropping"].includes(view.phase);
      const warming = tvOn && view.phase === "empty" ? Math.min(1, view.since / 350) : 1;
      screenMaterial.uniforms.power.value = tvOn ? warming * (0.9 + Math.random() * 0.1) : 0;
      screenMaterial.uniforms.time.value = now / 1000;
      tvLight.intensity = tvOn ? TV_LIGHT * (0.75 + Math.random() * 0.25) : 0;
      group.visible = view !== null;
    },
    dispose() {
      scene.remove(group, cribLight, cribLight.target, tvLight);
      cribLight.dispose();
      tvLight.dispose();
      screenMaterial.dispose();
      shaft.dispose();
      screen.geometry.dispose();
      face.dispose();
    },
  };
}

export async function loadNurseryFace(): Promise<Texture> {
  const texture = await new TextureLoader().loadAsync("/halloween/textures/nursery/face.png");
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
