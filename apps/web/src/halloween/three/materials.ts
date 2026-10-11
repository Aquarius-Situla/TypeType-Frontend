import {
  DoubleSide,
  type Material,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
} from "three";

type MapSet = { color: string; normal: string; roughness: string };

const loader = new TextureLoader();

function maps(id: string): MapSet {
  return {
    color: `/halloween/textures/${id}/color.jpg`,
    normal: `/halloween/textures/${id}/normal.jpg`,
    roughness: `/halloween/textures/${id}/roughness.jpg`,
  };
}

async function texture(
  url: string,
  repeatX: number,
  repeatY: number,
  color: boolean,
): Promise<Texture> {
  const loaded = await loader.loadAsync(url);
  loaded.wrapS = RepeatWrapping;
  loaded.wrapT = RepeatWrapping;
  loaded.repeat.set(repeatX, repeatY);
  loaded.anisotropy = 8;
  if (color) loaded.colorSpace = SRGBColorSpace;
  return loaded;
}

async function surface(
  id: string,
  repeat: [number, number],
  tint: number,
  normalStrength = 1,
): Promise<MeshStandardMaterial> {
  const set = maps(id);
  const [map, normalMap, roughnessMap] = await Promise.all([
    texture(set.color, repeat[0], repeat[1], true),
    texture(set.normal, repeat[0], repeat[1], false),
    texture(set.roughness, repeat[0], repeat[1], false),
  ]);
  const material = new MeshStandardMaterial({ map, normalMap, roughnessMap, color: tint });
  material.normalScale.set(normalStrength, normalStrength);
  return material;
}

export type CorridorMaterials = {
  wall: MeshStandardMaterial;
  roomWall: MeshStandardMaterial;
  floor: MeshStandardMaterial;
  ceiling: MeshStandardMaterial;
  wood: MeshStandardMaterial;
  darkWood: MeshStandardMaterial;
  gilt: MeshStandardMaterial;
  glass: MeshStandardMaterial;
  plaqueBack: MeshStandardMaterial;
  black: MeshBasicMaterial;
  shaft: MeshStandardMaterial;
  stone: MeshStandardMaterial;
  bedrock: MeshStandardMaterial;
  rail: MeshStandardMaterial;
  plate: MeshStandardMaterial;
  dispose: () => void;
};

export async function createMaterials(
  segmentLength: number,
  width: number,
  height: number,
): Promise<CorridorMaterials> {
  const [wall, roomWall, floor, ceiling, wood, darkWood, shaft, stone, plate, bedrock] =
    await Promise.all([
      surface("Wallpaper002B", [segmentLength / 220, height / 220], 0xc2ac8c, 1.2),
      surface("Wallpaper002B", [3, 1.5], 0x6a5d4c, 1),
      surface("Tiles141", [width / 150, segmentLength / 150], 0x8f877b, 1.4),
      surface("OfficeCeiling001", [width / 300, segmentLength / 300], 0x8d8a84, 1.2),
      surface("Wood066", [1, 1], 0x8a6a4c, 1.3),
      surface("Wood051", [1, 2], 0x6e5a48, 1.2),
      surface("Concrete044B", [3.5, 1.4], 0x8c8780, 1.4),
      surface("Concrete034", [0.6, 0.6], 0x77736c, 1.2),
      surface("DiamondPlate008C", [1, 1], 0x2c2e31, 1.3),
      surface("Rock030", [1, 1], 0xb09a86, 1.6),
    ]);
  plate.metalness = 0.65;
  shaft.side = DoubleSide;
  const rail = new MeshStandardMaterial({ color: 0x3a3632, metalness: 0.8, roughness: 0.55 });
  const gilt = new MeshStandardMaterial({ color: 0xb08a4a, metalness: 0.75, roughness: 0.35 });
  const glass = new MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.08,
    roughness: 0.04,
  });
  const plaqueBack = new MeshStandardMaterial({ color: 0xa8854c, metalness: 0.7, roughness: 0.4 });
  const black = new MeshBasicMaterial({ color: 0x000000 });
  const all: Material[] = [
    wall,
    roomWall,
    floor,
    ceiling,
    wood,
    darkWood,
    gilt,
    glass,
    plaqueBack,
    black,
    shaft,
    stone,
    bedrock,
    rail,
    plate,
  ];
  for (const material of all) material.userData.shared = true;
  return {
    wall,
    roomWall,
    floor,
    ceiling,
    wood,
    darkWood,
    gilt,
    glass,
    plaqueBack,
    black,
    shaft,
    stone,
    bedrock,
    rail,
    plate,
    dispose: () => {
      for (const material of all) {
        if (material instanceof MeshStandardMaterial) {
          material.map?.dispose();
          material.normalMap?.dispose();
          material.roughnessMap?.dispose();
        }
        material.dispose();
      }
    },
  };
}
