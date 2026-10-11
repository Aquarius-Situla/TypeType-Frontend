import { CanvasTexture, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import { m } from "../../paraglide/messages.js";
import { type KeyLabels, useKeyLabels } from "../key-labels";
import { paintLine, seeded } from "./painted-text";

export type ChalkControls = { mesh: Mesh; dispose: () => void };

const WIDTH = 2048;
const HEIGHT = 1520;
function lines(keys: KeyLabels): readonly (readonly [string, string])[] {
  return [
    [`${keys.KeyW} ${keys.KeyA} ${keys.KeyS} ${keys.KeyD}`, m.halloween_wall_walk()],
    ["↑ ← ↓ →", m.halloween_wall_arrows()],
    [m.halloween_wall_mouse(), m.halloween_wall_look()],
    [m.halloween_wall_shift(), m.halloween_wall_run()],
    [m.halloween_wall_click(), m.halloween_wall_lamp()],
    [m.halloween_wall_escape(), m.halloween_wall_flee()],
  ];
}

function draw(context: CanvasRenderingContext2D, keys: KeyLabels): void {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const random = seeded(66);
  lines(keys).forEach(([what, does], i) => {
    const baseline = 200 + i * 232 + (random() - 0.5) * 30;
    const end = paintLine(context, what, 50 + random() * 50, baseline, 112, random);
    paintLine(context, does, end + 64, baseline + (random() - 0.5) * 40, 82, random);
  });
  context.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 2600; i += 1) {
    context.fillStyle = `rgba(0, 0, 0, ${0.4 + Math.random() * 0.6})`;
    context.fillRect(Math.random() * WIDTH, Math.random() * HEIGHT, 1 + Math.random() * 2.5, 1.5);
  }
  context.globalCompositeOperation = "source-over";
}

export function createChalkControls(): ChalkControls {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  const redraw = (keys: KeyLabels): void => {
    if (!context) return;
    draw(context, keys);
    texture.needsUpdate = true;
  };
  redraw(useKeyLabels.getState().labels);
  const unsubscribe = useKeyLabels.subscribe((state, previous) => {
    if (state.labels !== previous.labels) redraw(state.labels);
  });
  const language = new MutationObserver(() => redraw(useKeyLabels.getState().labels));
  language.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  const material = new MeshStandardMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    roughness: 1,
    emissive: 0xffffff,
    emissiveMap: texture,
    emissiveIntensity: 0.32,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const geometry = new PlaneGeometry(330, (330 * HEIGHT) / WIDTH);
  material.userData.shared = true;
  geometry.userData.shared = true;
  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  return {
    mesh,
    dispose() {
      unsubscribe();
      language.disconnect();
      texture.dispose();
      material.dispose();
      geometry.dispose();
    },
  };
}
