import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Mesh,
  type MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

const AROUND = 72;
const DOWN = 30;

export function tartanTexture(): Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#211d18";
    ctx.fillRect(0, 0, size, size);
    const bands: [number, number, string][] = [
      [0, 64, "rgba(52,58,38,0.75)"],
      [96, 40, "rgba(20,17,14,0.7)"],
      [150, 8, "rgba(110,40,32,0.55)"],
      [184, 52, "rgba(60,48,34,0.6)"],
    ];
    for (const [at, width, color] of bands) {
      ctx.fillStyle = color;
      ctx.fillRect(at, 0, width, size);
      ctx.fillRect(0, at, size, width);
    }
    const image = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < image.data.length; i += 4) {
      const grain = 0.85 + Math.random() * 0.3;
      image.data[i] = (image.data[i] ?? 0) * grain;
      image.data[i + 1] = (image.data[i + 1] ?? 0) * grain;
      image.data[i + 2] = (image.data[i + 2] ?? 0) * grain;
    }
    ctx.putImageData(image, 0, 0);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

const smooth = (from: number, to: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

function blanketGeometry(top: number, bottom: number): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= DOWN; j += 1) {
    const t = j / DOWN;
    const shoulder = smooth(0, 0.12, t);
    const y = top - 12 * shoulder - ((top - 12 - bottom) * Math.max(0, t - 0.12)) / 0.88;
    const centreZ = -1.75 * shoulder;
    for (let i = 0; i <= AROUND; i += 1) {
      const a = (i / AROUND) * Math.PI * 2;
      const folds = (1.5 + 2.5 * t) * smooth(0.08, 0.3, t);
      const ripple =
        folds * Math.sin(a * 8 + 1.7 * Math.sin(a * 3)) + 0.8 * Math.sin(a * 19 + t * 4);
      const sides = 12 * t * Math.cos(a) ** 2;
      const rx = 14 + 15 * shoulder + 7 * t + sides + ripple;
      const back = Math.sin(a) < 0;
      const rz = back ? 12 + 3 * shoulder + ripple * 0.2 : 12 + 8 * shoulder + 6 * t + ripple * 0.6;
      positions.push(Math.cos(a) * rx, y, centreZ + Math.sin(a) * rz);
      uvs.push((i / AROUND) * 4, t * 2.2);
    }
  }
  const row = AROUND + 1;
  for (let j = 0; j < DOWN; j += 1) {
    for (let i = 0; i < AROUND; i += 1) {
      const a = j * row + i;
      const b = a + row;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.shared = true;
  return geometry;
}

let shared: { key: string; geometry: BufferGeometry } | null = null;

export function buildBlanket(material: MeshStandardMaterial, top: number, bottom: number): Mesh {
  const key = `${top}:${bottom}`;
  if (shared?.key !== key) shared = { key, geometry: blanketGeometry(top, bottom) };
  const blanket = new Mesh(shared.geometry, material);
  blanket.castShadow = false;
  blanket.receiveShadow = true;
  return blanket;
}
