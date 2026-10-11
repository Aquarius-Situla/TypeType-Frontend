import { Mesh, MeshBasicMaterial, type Object3D, PlaneGeometry } from "three";

export type FadeVeil = { set: (amount: number) => void; dispose: () => void };

export function createFadeVeil(camera: Object3D): FadeVeil {
  const material = new MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    fog: false,
  });
  const geometry = new PlaneGeometry(40, 40);
  const veil = new Mesh(geometry, material);
  veil.position.z = -6;
  veil.renderOrder = 9999;
  veil.frustumCulled = false;
  veil.visible = false;
  camera.add(veil);
  return {
    set(amount) {
      material.opacity = amount;
      veil.visible = amount > 0;
    },
    dispose() {
      veil.removeFromParent();
      geometry.dispose();
      material.dispose();
    },
  };
}
