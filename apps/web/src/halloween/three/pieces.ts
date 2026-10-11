import { BoxGeometry, type Material, Mesh, PlaneGeometry } from "three";

export function wallPiece(
  width: number,
  height: number,
  u: [number, number],
  v: [number, number],
  material: Material,
): Mesh {
  const geometry = new PlaneGeometry(width, height);
  const uv = geometry.attributes.uv;
  if (uv) {
    for (let i = 0; i < uv.count; i += 1) {
      uv.setXY(i, u[0] + uv.getX(i) * (u[1] - u[0]), v[0] + uv.getY(i) * (v[1] - v[0]));
    }
  }
  const mesh = new Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function box(width: number, height: number, depth: number, material: Material): Mesh {
  const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
