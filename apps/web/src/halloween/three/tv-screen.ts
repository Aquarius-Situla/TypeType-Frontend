import { CanvasTexture, SRGBColorSpace, type Texture } from "three";

export type ScreenFrames = { snow: Texture[]; off: Texture[] };

const WIDTH = 160;
const HEIGHT = 128;
const SNOW_FRAMES = 6;

function canvas(draw: (ctx: CanvasRenderingContext2D) => void): Texture {
  const element = document.createElement("canvas");
  element.width = WIDTH;
  element.height = HEIGHT;
  const ctx = element.getContext("2d");
  if (ctx) draw(ctx);
  const texture = new CanvasTexture(element);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function snow(frame: number): Texture {
  return canvas((ctx) => {
    const image = ctx.createImageData(WIDTH, HEIGHT);
    const band = (frame / SNOW_FRAMES) * HEIGHT;
    for (let y = 0; y < HEIGHT; y += 1) {
      const scan = y % 2 === 0 ? 1 : 0.72;
      const roll = 1 + 0.35 * Math.exp(-(((y - band) / 10) ** 2));
      for (let x = 0; x < WIDTH; x += 1) {
        const dx = (x / WIDTH - 0.5) * 2;
        const dy = (y / HEIGHT - 0.5) * 2;
        const vignette = 1 - 0.45 * (dx * dx + dy * dy);
        const v = Math.random() * 215 * scan * roll * vignette;
        const i = (y * WIDTH + x) * 4;
        image.data[i] = v * 0.9;
        image.data[i + 1] = v * 0.95;
        image.data[i + 2] = Math.min(255, v * 1.05);
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  });
}

function powerOff(step: number): Texture {
  return canvas((ctx) => {
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    if (step === 0) {
      const line = ctx.createLinearGradient(0, cy - 5, 0, cy + 5);
      line.addColorStop(0, "rgba(160,190,255,0)");
      line.addColorStop(0.5, "rgba(240,246,255,1)");
      line.addColorStop(1, "rgba(160,190,255,0)");
      ctx.fillStyle = line;
      ctx.fillRect(6, cy - 5, WIDTH - 12, 10);
      return;
    }
    const strength = [0, 1, 0.55, 0.22][step] ?? 0;
    if (strength === 0) return;
    const dot = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
    dot.addColorStop(0, `rgba(245,248,255,${strength})`);
    dot.addColorStop(0.25, `rgba(150,180,255,${strength * 0.7})`);
    dot.addColorStop(1, "rgba(60,90,200,0)");
    ctx.fillStyle = dot;
    ctx.fillRect(cx - 14, cy - 14, 28, 28);
  });
}

export function createScreenFrames(): ScreenFrames {
  return {
    snow: Array.from({ length: SNOW_FRAMES }, (_, i) => snow(i)),
    off: Array.from({ length: 5 }, (_, i) => powerOff(i)),
  };
}
