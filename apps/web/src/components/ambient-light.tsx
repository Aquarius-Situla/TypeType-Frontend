import { useEffect, useRef } from "react";
import { AMBIENT_LAYERS, AMBIENT_MAX_SCALE, ambientLayerRect } from "../lib/ambient-light";

const CANVAS_WIDTH = 128;
const CANVAS_HEIGHT = 72;
const BLUR_WIDTH = 24;
const BLUR_HEIGHT = 14;
const FRAME_INTERVAL_MS = 1000 / 30;

function edgeFade(): HTMLCanvasElement {
  const mask = document.createElement("canvas");
  mask.width = CANVAS_WIDTH;
  mask.height = CANVAS_HEIGHT;
  const context = mask.getContext("2d");
  if (!context) return mask;
  const edge = (1 - 1 / AMBIENT_MAX_SCALE) / 2;
  const fade = (x1: number, y1: number) => {
    const gradient = context.createLinearGradient(0, 0, x1, y1);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(edge * 0.5, "rgba(0, 0, 0, 0.35)");
    gradient.addColorStop(edge, "rgba(0, 0, 0, 1)");
    gradient.addColorStop(1 - edge, "rgba(0, 0, 0, 1)");
    gradient.addColorStop(1 - edge * 0.5, "rgba(0, 0, 0, 0.35)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    return gradient;
  };
  context.fillStyle = fade(CANVAS_WIDTH, 0);
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.globalCompositeOperation = "destination-in";
  context.fillStyle = fade(0, CANVAS_HEIGHT);
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  return mask;
}

function dockedVideo(): HTMLVideoElement | null {
  const frame = document.querySelector<HTMLElement>(".typetype-persistent-player-frame");
  if (!frame || "floating" in frame.dataset || "webFullscreen" in frame.dataset) return null;
  const video = frame.querySelector("video");
  return video && video.readyState >= 2 && video.videoWidth > 0 ? video : null;
}

export function AmbientLight() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const context = canvasRef.current?.getContext("2d");
    const frames = document.createElement("canvas");
    frames.width = CANVAS_WIDTH;
    frames.height = CANVAS_HEIGHT;
    const blur = document.createElement("canvas");
    blur.width = BLUR_WIDTH;
    blur.height = BLUR_HEIGHT;
    const fade = edgeFade();
    const framesContext = frames.getContext("2d");
    const blurContext = blur.getContext("2d");
    if (!root || !context || !framesContext || !blurContext) return;
    context.imageSmoothingQuality = "high";
    blurContext.imageSmoothingQuality = "high";

    let frame = 0;
    let lastDraw = 0;
    let lastVideo: HTMLVideoElement | null = null;
    let lastTime = -1;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - lastDraw < FRAME_INTERVAL_MS) return;
      const video = dockedVideo();
      root.style.opacity = video ? "1" : "0";
      if (!video || (video === lastVideo && video.currentTime === lastTime)) return;
      lastDraw = now;
      lastVideo = video;
      lastTime = video.currentTime;
      framesContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      for (const layer of AMBIENT_LAYERS) {
        const rect = ambientLayerRect(CANVAS_WIDTH, CANVAS_HEIGHT, layer.scale);
        framesContext.globalAlpha = layer.alpha;
        framesContext.drawImage(video, rect.x, rect.y, rect.width, rect.height);
      }
      blurContext.clearRect(0, 0, BLUR_WIDTH, BLUR_HEIGHT);
      blurContext.drawImage(frames, 0, 0, BLUR_WIDTH, BLUR_HEIGHT);
      context.globalCompositeOperation = "copy";
      context.drawImage(blur, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      context.globalCompositeOperation = "destination-in";
      context.drawImage(fade, 0, 0);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-ambient-light=""
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 aspect-video transition-opacity duration-700"
      style={{ opacity: 0 }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="absolute left-1/2 top-1/2 opacity-90"
        style={{
          width: `${AMBIENT_MAX_SCALE * 100}%`,
          height: `${AMBIENT_MAX_SCALE * 100}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
