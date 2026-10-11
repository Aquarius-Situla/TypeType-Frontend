import {
  Color,
  DoubleSide,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  ShaderMaterial,
  type WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { HALL } from "../corridor/stairs-layout";
import type { MemeFrame } from "../corridor/stick-show";
import { arc, screenShader } from "./hall-screen-parts";
import { createMemeLayer } from "./meme-layer";
import type { HeadScan } from "./models";
import { makeWatcherMaterial } from "./watcher-shader";

export type ScreenFace = {
  mesh: Mesh;
  update: (snow: number, face: number, meme: MemeFrame | null, now: number) => void;
  render: (renderer: WebGLRenderer) => void;
  warm: (renderer: WebGLRenderer) => void;
  dispose: () => void;
};

const SPAN = 0.62;
const HALF = HALL.screenArc / 2 - 0.05;
const HEIGHT = HALL.screenHeight * 0.86;
const SCREEN_ASPECT = (2 * SPAN * (HALL.screenRadius - 8)) / HEIGHT;

export function createScreenFace(head: HeadScan): ScreenFace {
  const target = new WebGLRenderTarget(1024, 768, {
    generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter,
  });
  const meme = createMemeLayer();
  const material = new ShaderMaterial({
    ...screenShader,
    uniforms: {
      face: { value: target.texture },
      sticks: { value: meme.sticks },
      clip: { value: meme.sticks },
      reveal: { value: 0 },
      clipOn: { value: 0 },
      sticksOn: { value: 0 },
      stretch: { value: 1 },
      snow: { value: 0 },
      time: { value: 0 },
      region: { value: SPAN / HALF },
      blur: { value: 0 },
    },
    toneMapped: false,
    fog: false,
    side: DoubleSide,
  });
  const mid = Math.PI / 2;
  const mesh = new Mesh(arc(HALL.screenRadius - 8, HEIGHT, mid - HALF, mid + HALF), material);
  mesh.renderOrder = 2;

  const scene = new Scene();
  scene.background = new Color(0x000000);
  const skin = new MeshStandardMaterial({
    map: head.color,
    normalMap: head.normal,
    color: 0xb4b6aa,
    roughness: 0.62,
  });
  const watcher = makeWatcherMaterial(skin);
  const face = new Mesh(head.geometry, skin);
  scene.add(face);
  const under = new PointLight(0xffffff, 150, 0, 1.6);
  under.position.set(0.4, -3.2, 6.5);
  const rim = new PointLight(0x9fb0c8, 30, 0, 1.6);
  rim.position.set(-5, 3, -2);
  scene.add(under, rim);
  const camera = new PerspectiveCamera(26, 1024 / 768, 0.1, 100);
  camera.position.set(0, 1.0, 15);
  camera.lookAt(0, 1.1, 0);

  const draw = (renderer: WebGLRenderer): void => {
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
  };

  return {
    mesh,
    update(snow, reveal, frame, now) {
      material.uniforms.reveal.value = reveal * (frame?.face ?? 1);
      meme.update(frame);
      const clip = meme.video();
      material.uniforms.clipOn.value = clip?.shown ?? 0;
      material.uniforms.sticksOn.value = frame && frame.sticks.length > 0 ? 1 : 0;
      if (clip) {
        material.uniforms.clip.value = clip.texture;
        material.uniforms.stretch.value = SCREEN_ASPECT / clip.aspect;
      }
      watcher.uSway.value = Math.sin(now / 2300) * 0.6;
      material.uniforms.snow.value = snow;
      material.uniforms.blur.value = 6 * (1 - reveal) ** 1.5;
      material.uniforms.time.value = now / 1000;
      mesh.visible = snow > 0 || reveal > 0;
    },
    render(renderer) {
      if (mesh.visible && material.uniforms.reveal.value > 0) draw(renderer);
      if (mesh.visible) meme.render(renderer);
    },
    warm(renderer) {
      renderer.compile(scene, camera);
      draw(renderer);
      meme.warm(renderer);
    },
    dispose() {
      target.dispose();
      meme.dispose();
      material.dispose();
      skin.dispose();
      mesh.geometry.dispose();
    },
  };
}
