import {
  Color,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  type Texture,
  VideoTexture,
  type WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { CLIP_FADE, type MemeFrame, type MemeVideo, STICK_COUNT } from "../corridor/stick-show";

export type MemeLayer = {
  sticks: Texture;
  video: () => { texture: Texture; aspect: number; shown: number } | null;
  update: (frame: MemeFrame | null) => void;
  render: (renderer: WebGLRenderer) => void;
  warm: (renderer: WebGLRenderer) => void;
  dispose: () => void;
};

const WIDTH = 1024;
const HEIGHT = 768;
const ASPECT = WIDTH / HEIGHT;
const SIZE = 0.8;
const THICKNESS = 0.012;
const CREAM = 0xf3ead2;

type Clip = { element: HTMLVideoElement; texture: VideoTexture; aspect: number };

function clip(name: MemeVideo, aspect: number): Clip {
  const element = document.createElement("video");
  const mp4 = element.canPlayType('video/mp4; codecs="avc1.64001e, mp4a.40.2"') !== "";
  element.src = `/halloween/video/${name}.${mp4 ? "mp4" : "webm"}`;
  element.preload = "auto";
  element.playsInline = true;
  element.load();
  const texture = new VideoTexture(element);
  return { element, texture, aspect };
}

export function createMemeLayer(): MemeLayer {
  const target = new WebGLRenderTarget(WIDTH, HEIGHT);
  const scene = new Scene();
  scene.background = new Color(0x000000);
  const camera = new OrthographicCamera(-ASPECT / 2, ASPECT / 2, 0.5, -0.5, -1, 1);
  const geometry = new PlaneGeometry(1, 1);
  const sticks = Array.from({ length: STICK_COUNT }, () => {
    const material = new MeshBasicMaterial({ color: CREAM, transparent: true, opacity: 0 });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);
    return { mesh, material };
  });
  const clips: Record<MemeVideo, Clip> = {
    stickbug: clip("stickbug", 408 / 360),
    rickroll: clip("rickroll", 1),
  };
  let playing: MemeVideo | null = null;
  let drawn = false;

  return {
    sticks: target.texture,
    video() {
      if (!playing) return null;
      const { element, texture, aspect } = clips[playing];
      const [from, to] = CLIP_FADE[playing];
      const shown = Math.max(0, Math.min(1, (element.currentTime * 1000 - from) / (to - from)));
      return { texture, aspect, shown };
    },
    update(frame) {
      const wanted = frame?.track?.name ?? null;
      if (wanted !== playing) {
        if (playing) clips[playing].element.pause();
        playing = wanted;
        if (wanted && frame?.track) {
          const element = clips[wanted].element;
          element.currentTime = frame.track.since / 1000;
          void element.play().catch(() => undefined);
        }
      }
      const shown = frame?.sticks ?? [];
      drawn = shown.length > 0;
      sticks.forEach(({ mesh, material }, i) => {
        const stick = shown[i];
        mesh.visible = stick !== undefined && stick.opacity > 0;
        if (!stick) return;
        const [x1, y1, x2, y2] = stick.shape;
        const ax = (x1 - 0.5) * SIZE;
        const ay = -(y1 - 0.5) * SIZE;
        const bx = (x2 - 0.5) * SIZE;
        const by = -(y2 - 0.5) * SIZE;
        mesh.position.set((ax + bx) / 2, (ay + by) / 2, 0);
        mesh.rotation.z = Math.atan2(by - ay, bx - ax);
        mesh.scale.set(Math.hypot(bx - ax, by - ay) + THICKNESS, THICKNESS, 1);
        material.opacity = stick.opacity;
      });
    },
    render(renderer) {
      if (!drawn) return;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
    },
    warm(renderer) {
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
    },
    dispose() {
      for (const { element, texture } of Object.values(clips)) {
        element.pause();
        element.removeAttribute("src");
        element.load();
        texture.dispose();
      }
      for (const { material } of sticks) material.dispose();
      geometry.dispose();
      target.dispose();
    },
  };
}
