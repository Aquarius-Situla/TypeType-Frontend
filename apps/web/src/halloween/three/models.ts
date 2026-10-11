import {
  type BufferGeometry,
  type Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Object3D,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ToyKind } from "../corridor/toys-behind";

const UNITS_PER_METRE = 125;

export type ModelTemplates = {
  frame: Group;
  fluorescent: Object3D;
  fireAlarm: Group;
  clock: Group;
  television: Group;
  armchair: Group;
  stairs: Group;
  rock: Group;
  exitLight: Group;
  sounder: Group;
  crib: Group;
  toys: Record<ToyKind, Group>;
  head: HeadScan;
};

export type HeadScan = { geometry: BufferGeometry; color: Texture; normal: Texture };

const HEAD = "/halloween/models/lee-perry-smith";

async function loadHead(): Promise<HeadScan> {
  const loader = new TextureLoader();
  const [gltf, color, normal] = await Promise.all([
    new GLTFLoader().loadAsync(`${HEAD}/lee-perry-smith.glb`),
    loader.loadAsync(`${HEAD}/color.jpg`),
    loader.loadAsync(`${HEAD}/normal.jpg`),
  ]);
  color.colorSpace = SRGBColorSpace;
  const mesh = gltf.scene.getObjectByName("LeePerrySmith");
  if (!(mesh instanceof Mesh)) throw new Error("Missing head scan");
  const geometry: BufferGeometry = mesh.geometry;
  geometry.userData.shared = true;
  return { geometry, color, normal };
}

async function load(id: string, url = `/halloween/models/${id}/${id}_1k.gltf`): Promise<Group> {
  const gltf = await new GLTFLoader().loadAsync(url);
  gltf.scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      material.userData.shared = true;
      for (const value of Object.values(material)) {
        if (value instanceof Texture) value.anisotropy = 8;
      }
      if (material instanceof MeshPhysicalMaterial && material.transmission > 0) {
        material.transmission = 0;
        material.transparent = true;
        material.opacity = 0.2;
      }
    }
    object.geometry.userData.shared = true;
  });
  return gltf.scene;
}

export async function loadModels(): Promise<ModelTemplates> {
  const [
    frame,
    lights,
    fireAlarm,
    clock,
    television,
    armchair,
    stairs,
    rock,
    exitLight,
    sounder,
    crib,
    doll,
    teddy,
    grungy,
    head,
  ] = await Promise.all([
    load("fancy_picture_frame_01"),
    load("mounted_fluorescent_lights"),
    load("fire_alarm"),
    load("wall_clock"),
    load("television_02"),
    load("ArmChair_01"),
    load("concrete-stairs", "/halloween/models/concrete-stairs/scene.gltf"),
    load("rock_face_02"),
    load("exit-light", "/halloween/models/exit-light/scene.gltf"),
    load("roshni", "/halloween/models/roshni/scene.gltf"),
    load("old-crib", "/halloween/models/old-crib/scene.gltf"),
    load("old-doll", "/halloween/models/old-doll/scene.gltf"),
    load("old-teddy", "/halloween/models/old-teddy/scene.gltf"),
    load("grungy-teddy", "/halloween/models/grungy-teddy/scene.gltf"),
    loadHead(),
  ]);
  const fluorescent = lights.getObjectByName("mounted_fluorescent_lights_a");
  if (!fluorescent) throw new Error("Missing fluorescent fixture");
  fluorescent.position.set(0, 0, 0);
  return {
    frame,
    fluorescent,
    fireAlarm,
    clock,
    television,
    armchair,
    stairs,
    rock,
    exitLight,
    sounder,
    crib,
    toys: { doll, teddy, grungy },
    head,
  };
}

export function instance(template: Object3D, scale: number): Object3D {
  const copy = template.clone(true);
  copy.scale.setScalar(scale * UNITS_PER_METRE);
  return copy;
}

export const FRAME_CANVAS_ASPECT = 0.539 / 0.4;

export function frameWithThumbnail(template: Group, thumbnail: Texture, scale: number): Object3D {
  const copy = instance(template, scale);
  const canvas = copy.getObjectByName("fancy_picture_frame_01_canvas");
  if (canvas instanceof Mesh) {
    canvas.material = new MeshStandardMaterial({ map: thumbnail, roughness: 0.55 });
  }
  return copy;
}
