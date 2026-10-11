import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
} from "three";
import type { GalleryItem } from "../corridor/corridor-gallery";
import type { CorridorMaterials } from "./materials";
import { FRAME_CANVAS_ASPECT, frameWithThumbnail, type ModelTemplates } from "./models";

const FRAME_SCALE = 2.78;
const loader = new TextureLoader();
const thumbnails = new Map<string, Texture>();
const plaques = new Map<string, Texture>();
const plaqueGeometry = new BoxGeometry(150, 34, 2);
plaqueGeometry.userData.shared = true;

function thumbnail(item: GalleryItem): Texture {
  const cached = thumbnails.get(item.key);
  if (cached) return cached;
  const texture = loader.load(item.thumbnail);
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false;
  const crop = FRAME_CANVAS_ASPECT / (16 / 9);
  texture.repeat.set(crop, 1);
  texture.offset.set((1 - crop) / 2, 0);
  thumbnails.set(item.key, texture);
  return texture;
}

function plaque(item: GalleryItem): Texture {
  const cached = plaques.get(item.key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const brass = ctx.createLinearGradient(0, 0, 512, 128);
    brass.addColorStop(0, "#d6b778");
    brass.addColorStop(0.55, "#8a6a38");
    brass.addColorStop(1, "#b8935a");
    ctx.fillStyle = brass;
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#2a1c0c";
    ctx.textAlign = "center";
    ctx.font = "600 30px Georgia, serif";
    ctx.fillText(item.title.length > 34 ? `${item.title.slice(0, 33)}…` : item.title, 256, 58, 480);
    ctx.font = "20px Georgia, serif";
    ctx.fillText(item.channelName.toUpperCase(), 256, 96, 480);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  plaques.set(item.key, texture);
  return texture;
}

export function buildFrame(
  item: GalleryItem,
  materials: CorridorMaterials,
  models: ModelTemplates,
): Group {
  const group = new Group();
  const frame = frameWithThumbnail(models.frame, thumbnail(item), FRAME_SCALE);
  const label = new Mesh(plaqueGeometry, [
    materials.plaqueBack,
    materials.plaqueBack,
    materials.plaqueBack,
    materials.plaqueBack,
    new MeshStandardMaterial({ map: plaque(item), metalness: 0.6, roughness: 0.45 }),
    materials.plaqueBack,
  ]);
  label.position.set(0, -108, 2);
  label.castShadow = true;
  group.add(frame, label);
  return group;
}
