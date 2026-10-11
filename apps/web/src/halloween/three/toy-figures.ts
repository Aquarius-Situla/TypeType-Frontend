import { Box3, Group, Mesh, MeshStandardMaterial, type Object3D, type Scene, Vector3 } from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import type { Toy, ToyKind } from "../corridor/toys-behind";

export type ToyFigures = {
  update: (toys: Toy[], eye: { x: number; z: number }) => void;
  dispose: () => void;
};

const HEIGHT: Record<ToyKind, number> = { doll: 74, teddy: 54, grungy: 48 };
const LEAN: Record<ToyKind, number> = { doll: 0.06, teddy: -0.1, grungy: 0.14 };
const FRONT: Record<ToyKind, number> = { doll: Math.PI, teddy: Math.PI / 2, grungy: 0 };
const GRIME: Record<ToyKind, number> = { doll: 0.9, teddy: 0.42, grungy: 0.8 };

function standing(template: Object3D, height: number): Group {
  const model = template.clone(true);
  const holder = new Group();
  holder.add(model);
  holder.updateMatrixWorld(true);
  const size = new Box3().setFromObject(model).getSize(new Vector3());
  model.scale.multiplyScalar(height / size.y);
  holder.updateMatrixWorld(true);
  const placed = new Box3().setFromObject(model);
  const centre = placed.getCenter(new Vector3());
  model.position.set(-centre.x, -placed.min.y, -centre.z);
  return holder;
}

export function createToyFigures(scene: Scene, templates: Record<ToyKind, Group>): ToyFigures {
  const kinds: ToyKind[] = ["doll", "teddy", "grungy"];
  const figures = new Map<ToyKind, Group>();
  for (const kind of kinds) {
    const figure = standing(templates[kind], HEIGHT[kind]);
    figure.traverse((object) => {
      if (object instanceof Mesh && object.material instanceof MeshStandardMaterial)
        object.material.color.multiplyScalar(GRIME[kind]);
    });
    figure.visible = false;
    figure.rotation.z = LEAN[kind];
    figures.set(kind, figure);
    scene.add(figure);
  }
  let shown: Toy[] = [];

  return {
    update(toys, eye) {
      if (toys === shown) return;
      shown = toys;
      for (const [kind, figure] of figures) {
        const toy = toys.find((candidate) => candidate.kind === kind);
        figure.visible = toy !== undefined;
        if (!toy) continue;
        const z = -toy.distance;
        figure.position.set(toy.x, -CORRIDOR.floor, z);
        figure.rotation.y = Math.atan2(eye.x - toy.x, eye.z - z) + FRONT[kind];
      }
    },
    dispose() {
      for (const figure of figures.values()) scene.remove(figure);
    },
  };
}
