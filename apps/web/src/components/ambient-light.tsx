import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { type AmbientRect, ambientLayers } from "../lib/ambient-light";

const CANVAS_WIDTH = 160;
const BLUR_STEPS = [4, 8];
const FRAME_INTERVAL_MS = 1000 / 30;

function dockedPlayer(): { video: HTMLVideoElement; rect: DOMRect } | null {
  const frame = document.querySelector<HTMLElement>(".typetype-persistent-player-frame");
  if (!frame || "floating" in frame.dataset || "webFullscreen" in frame.dataset) return null;
  const video = frame.querySelector("video");
  if (!video || video.readyState < 2 || video.videoWidth === 0) return null;
  const rect = frame.getBoundingClientRect();
  return rect.bottom > 0 && rect.width > 0 ? { video, rect } : null;
}

function offscreen(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) context.imageSmoothingQuality = "high";
  return { canvas, context };
}

export function AmbientLight() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const root = document.documentElement;
    root.dataset.ambientLight = "";

    let width = 0;
    let height = 0;
    let frames = offscreen(1, 1);
    let blurs = BLUR_STEPS.map(() => offscreen(1, 1));
    const resize = () => {
      width = CANVAS_WIDTH;
      height = Math.max(1, Math.round((CANVAS_WIDTH * window.innerHeight) / window.innerWidth));
      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingQuality = "high";
      frames = offscreen(width, height);
      blurs = BLUR_STEPS.map((step) =>
        offscreen(Math.max(1, Math.round(width / step)), Math.max(1, Math.round(height / step))),
      );
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let lastDraw = 0;
    let lastKey = "";
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - lastDraw < FRAME_INTERVAL_MS) return;
      const player = dockedPlayer();
      canvas.style.opacity = player ? "1" : "0";
      if (!player || !frames.context) return;
      const scaleX = width / window.innerWidth;
      const scaleY = height / window.innerHeight;
      const target: AmbientRect = {
        x: player.rect.left * scaleX,
        y: player.rect.top * scaleY,
        width: player.rect.width * scaleX,
        height: player.rect.height * scaleY,
      };
      const key = `${player.video.currentTime}:${target.x.toFixed(1)}:${target.y.toFixed(1)}:${target.width.toFixed(1)}`;
      if (key === lastKey) return;
      lastKey = key;
      lastDraw = now;

      frames.context.clearRect(0, 0, width, height);
      for (const layer of ambientLayers(target, { x: 0, y: 0, width, height })) {
        frames.context.globalAlpha = layer.alpha;
        frames.context.drawImage(player.video, layer.x, layer.y, layer.width, layer.height);
      }
      let source: HTMLCanvasElement = frames.canvas;
      for (const blur of blurs) {
        if (!blur.context) return;
        blur.context.globalCompositeOperation = "copy";
        blur.context.drawImage(source, 0, 0, blur.canvas.width, blur.canvas.height);
        source = blur.canvas;
      }
      context.globalCompositeOperation = "copy";
      context.drawImage(source, 0, 0, width, height);

      const centerX = target.x + target.width / 2;
      const centerY = target.y + target.height / 2;
      const inner = Math.hypot(target.width, target.height) / 2;
      const outer = Math.max(inner + 1, Math.hypot(width, height));
      const fade = context.createRadialGradient(
        centerX,
        centerY,
        inner * 0.6,
        centerX,
        centerY,
        outer,
      );
      fade.addColorStop(0, "rgba(0, 0, 0, 1)");
      fade.addColorStop(0.45, "rgba(0, 0, 0, 0.7)");
      fade.addColorStop(1, "rgba(0, 0, 0, 0.15)");
      context.globalCompositeOperation = "destination-in";
      context.fillStyle = fade;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "source-atop";
      context.fillStyle = "rgba(0, 0, 0, 0.3)";
      context.fillRect(0, 0, width, height);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      delete root.dataset.ambientLight;
    };
  }, []);

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <canvas
        ref={canvasRef}
        data-ambient-light=""
        className="h-full w-full transition-opacity duration-700"
        style={{ opacity: 0 }}
      />
    </div>,
    document.body,
  );
}
