import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  type AmbientTuning,
  ambientBlurPx,
  ambientFadeGradientStops,
  ambientScales,
} from "../lib/ambient-light";

const RESOLUTION = 1 / 3;
const FRAME_INTERVAL_MS = 1000 / 30;
// A few pixels of the frame stretched over the screen: a soft wash of its colors on every part
// of the page, under the halo.
const WASH_WIDTH = 8;
const WASH_HEIGHT = 5;
const WASH_ALPHA = 0.4;

type Target = { x: number; y: number; width: number; height: number };

// The halo follows the player frame wherever it sits, docked or floating; a frame scrolled out
// of view or dismissed keeps only the page-wide wash.
function currentPlayer(): { video: HTMLVideoElement; rect: DOMRect | null } | null {
  const frame = document.querySelector<HTMLElement>(".typetype-persistent-player-frame");
  if (!frame || "webFullscreen" in frame.dataset) return null;
  const video = frame.querySelector("video");
  if (!video || video.readyState < 2 || video.videoWidth === 0) return null;
  const rect = frame.getBoundingClientRect();
  const shown =
    !frame.classList.contains("invisible") &&
    rect.width > 0 &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight;
  return { video, rect: shown ? rect : null };
}

// Safari accepts a filter value without drawing it, so the blur has to be seen to be trusted.
function canvasBlurWorks(): boolean {
  const probe = document.createElement("canvas");
  probe.width = 9;
  probe.height = 9;
  const context = probe.getContext("2d", { willReadFrequently: true });
  if (!context) return false;
  context.filter = "blur(2px)";
  context.fillStyle = "#fff";
  context.fillRect(4, 4, 1, 1);
  return context.getImageData(2, 4, 1, 1).data[3] > 0;
}

function fadeGradient(
  context: CanvasRenderingContext2D,
  start: number,
  size: number,
  edge: number,
  horizontal: boolean,
): CanvasGradient {
  const gradient = horizontal
    ? context.createLinearGradient(start - edge, 0, start + size + edge, 0)
    : context.createLinearGradient(0, start - edge, 0, start + size + edge);
  for (const stop of ambientFadeGradientStops(size, edge)) {
    gradient.addColorStop(stop.offset, `rgba(0, 0, 0, ${stop.alpha})`);
  }
  return gradient;
}

function drawLight(
  layers: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  target: Target,
  spread: number,
) {
  const { width, height } = layers.canvas;
  layers.globalCompositeOperation = "source-over";
  layers.clearRect(0, 0, width, height);
  const centerX = target.x + target.width / 2;
  const centerY = target.y + target.height / 2;
  const scales = ambientScales(spread);
  for (const scale of scales) {
    const w = target.width * scale;
    const h = target.height * scale;
    layers.drawImage(video, centerX - w / 2, centerY - h / 2, w, h);
  }
  const outer = scales[0] + 0.01;
  const edgeX = ((outer - 1) / 2) * target.width;
  const edgeY = ((outer - 1) / 2) * target.height;
  layers.globalCompositeOperation = "destination-in";
  layers.fillStyle = fadeGradient(layers, target.x, target.width, edgeX, true);
  layers.fillRect(0, 0, width, height);
  layers.fillStyle = fadeGradient(layers, target.y, target.height, edgeY, false);
  layers.fillRect(0, 0, width, height);
}

export function AmbientLight({ tuning }: { tuning: AmbientTuning }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tuningRef = useRef(tuning);
  tuningRef.current = tuning;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const layersCanvas = document.createElement("canvas");
    const layers = layersCanvas.getContext("2d");
    const smallCanvas = document.createElement("canvas");
    const small = smallCanvas.getContext("2d");
    const washCanvas = document.createElement("canvas");
    washCanvas.width = WASH_WIDTH;
    washCanvas.height = WASH_HEIGHT;
    const wash = washCanvas.getContext("2d");
    if (!canvas || !context || !layers || !small || !wash) return;
    const root = document.documentElement;
    root.dataset.ambientLight = "";
    const filterSupported = canvasBlurWorks();

    const resize = () => {
      const width = Math.max(1, Math.round(window.innerWidth * RESOLUTION));
      const height = Math.max(1, Math.round(window.innerHeight * RESOLUTION));
      canvas.width = width;
      canvas.height = height;
      layersCanvas.width = width;
      layersCanvas.height = height;
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let lastDraw = 0;
    let lastKey = "";
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - lastDraw < FRAME_INTERVAL_MS) return;
      const player = currentPlayer();
      canvas.style.opacity = player ? "1" : "0";
      if (!player) return;
      const { spread, blur, brightness } = tuningRef.current;
      const target: Target | null = player.rect && {
        x: player.rect.left * RESOLUTION,
        y: player.rect.top * RESOLUTION,
        width: player.rect.width * RESOLUTION,
        height: player.rect.height * RESOLUTION,
      };
      const key = `${player.video.currentTime}:${target?.x}:${target?.y}:${target?.width}:${spread}:${blur}:${brightness}`;
      if (key === lastKey) return;
      lastKey = key;
      lastDraw = now;

      wash.drawImage(player.video, 0, 0, WASH_WIDTH, WASH_HEIGHT);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingQuality = "high";
      context.globalAlpha = Math.min(1, (WASH_ALPHA * brightness) / 100);
      context.drawImage(washCanvas, 0, 0, canvas.width, canvas.height);
      context.globalAlpha = 1;
      if (!target) return;

      drawLight(layers, player.video, target, spread);
      const blurPx = ambientBlurPx(blur, target.height);
      if (filterSupported) {
        context.filter = `blur(${blurPx}px) brightness(${brightness}%)`;
        context.drawImage(layersCanvas, 0, 0);
        context.filter = "none";
        return;
      }
      const shrink = Math.max(1, blurPx / 2);
      smallCanvas.width = Math.max(1, Math.round(canvas.width / shrink));
      smallCanvas.height = Math.max(1, Math.round(canvas.height / shrink));
      small.imageSmoothingQuality = "high";
      small.drawImage(layersCanvas, 0, 0, smallCanvas.width, smallCanvas.height);
      context.imageSmoothingQuality = "high";
      context.globalAlpha = Math.min(1, brightness / 100);
      context.drawImage(smallCanvas, 0, 0, canvas.width, canvas.height);
      context.globalAlpha = 1;
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
