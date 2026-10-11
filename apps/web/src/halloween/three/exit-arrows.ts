import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import type { SignArrow } from "../corridor/route-signs";

export type ExitArrows = {
  build: (arrow: SignArrow) => Group;
  dispose: () => void;
};

const WIDTH = 74;
const HEIGHT = 30;
const DEPTH = 6;
const HANG = 26;
const ARROWS: readonly SignArrow[] = ["ahead", "left", "right"];

function runningMan(context: CanvasRenderingContext2D, x: number, y: number): void {
  const limb = (points: readonly (readonly [number, number])[]): void => {
    context.beginPath();
    points.forEach(([px, py], i) => {
      if (i === 0) context.moveTo(x + px, y + py);
      else context.lineTo(x + px, y + py);
    });
    context.stroke();
  };
  context.beginPath();
  context.arc(x + 20, y - 54, 13, 0, Math.PI * 2);
  context.fill();
  limb([
    [10, -36],
    [-6, 8],
  ]);
  limb([
    [6, -30],
    [28, -18],
    [40, -32],
  ]);
  limb([
    [6, -30],
    [-16, -22],
    [-30, -6],
  ]);
  limb([
    [-6, 8],
    [16, 22],
    [14, 52],
  ]);
  limb([
    [-6, 8],
    [-20, 32],
    [-44, 36],
  ]);
}

function signTexture(arrow: SignArrow): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 208;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#0a7d3b";
    context.fillRect(0, 0, 512, 208);
    context.strokeStyle = "#e9fff1";
    context.fillStyle = "#e9fff1";
    context.lineWidth = 8;
    context.strokeRect(10, 10, 492, 188);
    context.fillRect(arrow === "left" ? 384 : 40, 40, 88, 128);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 15;
    const manX = arrow === "left" ? 300 : 210;
    context.save();
    if (arrow === "left") {
      context.translate(manX * 2, 0);
      context.scale(-1, 1);
    }
    runningMan(context, manX, 112);
    context.restore();
    const arrowX = arrow === "left" ? 90 : 410;
    context.save();
    context.translate(arrowX, 104);
    context.rotate(arrow === "ahead" ? -Math.PI / 2 : arrow === "left" ? Math.PI : 0);
    context.beginPath();
    context.moveTo(-44, -14);
    context.lineTo(6, -14);
    context.lineTo(6, -40);
    context.lineTo(48, 0);
    context.lineTo(6, 40);
    context.lineTo(6, 14);
    context.lineTo(-44, 14);
    context.closePath();
    context.fill();
    context.restore();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createExitArrows(): ExitArrows {
  const faces = new Map<SignArrow, MeshBasicMaterial>(
    ARROWS.map((arrow): [SignArrow, MeshBasicMaterial] => {
      const material = new MeshBasicMaterial({ map: signTexture(arrow), toneMapped: false });
      material.color.setScalar(0.85);
      material.userData.shared = true;
      return [arrow, material];
    }),
  );
  const housing = new MeshStandardMaterial({ color: 0x2a2c2a, roughness: 0.6, metalness: 0.4 });
  housing.userData.shared = true;
  const box = new BoxGeometry(WIDTH + 4, HEIGHT + 4, DEPTH);
  const face = new PlaneGeometry(WIDTH, HEIGHT);
  const rod = new CylinderGeometry(0.8, 0.8, HANG, 6);
  for (const geometry of [box, face, rod]) geometry.userData.shared = true;

  return {
    build(arrow) {
      const group = new Group();
      const front = new Mesh(face, faces.get(arrow));
      front.position.z = DEPTH / 2 + 0.2;
      group.add(new Mesh(box, housing), front);
      for (const side of [-1, 1]) {
        const hanger = new Mesh(rod, housing);
        hanger.position.set((side * WIDTH) / 3, HEIGHT / 2 + HANG / 2, 0);
        group.add(hanger);
      }
      group.position.y = CORRIDOR.ceiling - HANG - HEIGHT / 2;
      return group;
    },
    dispose() {
      for (const material of faces.values()) {
        material.map?.dispose();
        material.dispose();
      }
      housing.dispose();
      for (const geometry of [box, face, rod]) geometry.dispose();
    },
  };
}
