import { GLYPHS, type Stroke } from "./brush-glyphs";

const HAND_FONT = `"Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", "SimSun", serif`;

type Point = { x: number; y: number };

const BRISTLES = 9;
const PAINTS = ["124, 8, 6", "98, 4, 4", "72, 2, 2", "140, 14, 10"] as const;

export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function resample(points: readonly Point[], step: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) continue;
    const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
    for (let k = 0; k < count; k += 1) {
      const t = k / count;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  const last = points[points.length - 1];
  if (last) out.push(last);
  return out;
}

function drip(
  context: CanvasRenderingContext2D,
  at: Point,
  width: number,
  random: () => number,
): void {
  const length = width * (1.5 + random() * 4);
  context.lineWidth = width * (0.18 + random() * 0.2);
  context.beginPath();
  context.moveTo(at.x, at.y);
  context.quadraticCurveTo(at.x + (random() - 0.5) * width, at.y + length / 2, at.x, at.y + length);
  context.stroke();
  context.beginPath();
  context.arc(at.x, at.y + length, context.lineWidth * 0.9, 0, Math.PI * 2);
  context.fill();
}

function brushStroke(
  context: CanvasRenderingContext2D,
  points: readonly Point[],
  width: number,
  paint: string,
  random: () => number,
): void {
  const path = resample(points, 2.5);
  const wobble = width * 0.25;
  const phase = random() * Math.PI * 2;
  const shaken = path.map((p, i) => {
    const t = i / Math.max(1, path.length - 1);
    const n = Math.sin(t * 9 + phase) * wobble + Math.sin(t * 23 + phase * 2) * wobble * 0.4;
    return { x: p.x + n * 0.6, y: p.y + n * 0.4, t };
  });
  const pressure = (t: number): number => Math.min(1, 0.5 + t * 8) * (1 - 0.72 * t ** 1.4);
  context.strokeStyle = `rgba(${paint}, 0.6)`;
  for (let i = 1; i < shaken.length; i += 1) {
    const a = shaken[i - 1];
    const b = shaken[i];
    if (!a || !b) continue;
    context.lineWidth = width * 0.3 * pressure(b.t);
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
  }
  for (let k = 0; k < BRISTLES; k += 1) {
    const offset = (k / (BRISTLES - 1) - 0.5) * width + (random() - 0.5) * width * 0.12;
    const dry = 0.25 + random() * 0.65;
    context.strokeStyle = `rgba(${paint}, ${0.55 + random() * 0.4})`;
    context.lineWidth = (width / BRISTLES) * (1.2 + random() * 1.1);
    context.beginPath();
    let drawing = false;
    for (let i = 1; i < shaken.length; i += 1) {
      const a = shaken[i - 1];
      const b = shaken[i];
      if (!a || !b) continue;
      const skip = b.t > dry && random() < (b.t - dry) * 3.2;
      const nx = -(b.y - a.y);
      const ny = b.x - a.x;
      const len = Math.hypot(nx, ny) || 1;
      const o = offset * pressure(b.t);
      const x = b.x + (nx / len) * o;
      const y = b.y + (ny / len) * o;
      if (skip) drawing = false;
      else if (!drawing) {
        context.moveTo(x, y);
        drawing = true;
      } else context.lineTo(x, y);
    }
    context.stroke();
  }
  const end = shaken[shaken.length - 1];
  if (end && random() < 0.07) {
    context.fillStyle = `rgba(${paint}, 0.85)`;
    context.strokeStyle = `rgba(${paint}, 0.85)`;
    drip(context, end, width, random);
  }
}

function place(
  stroke: Stroke,
  x: number,
  top: number,
  size: number,
  slant: number,
  turn: number,
): Point[] {
  const cx = x + size * 0.25;
  const cy = top + size * 0.5;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  return stroke.map(([gx, gy]) => {
    const px = x + gx * size * 0.82 + (1 - gy) * slant * size - cx;
    const py = top + gy * size - cy;
    return { x: cx + px * cos - py * sin, y: cy + px * sin + py * cos };
  });
}

export function paintLine(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  baseline: number,
  size: number,
  random: () => number,
): number {
  context.lineCap = "round";
  context.lineJoin = "round";
  let cursor = x;
  let drift = 0;
  for (const raw of text.toUpperCase()) {
    if (raw === " ") {
      cursor += size * (0.6 + random() * 0.5);
      continue;
    }
    const glyph = GLYPHS[raw];
    const scale = 0.7 + random() * 0.65;
    const letter = size * scale;
    drift += (random() - 0.5) * size * 0.16;
    const top = baseline - letter + drift + (random() - 0.5) * size * 0.24;
    const paint = PAINTS[Math.floor(random() * PAINTS.length)] ?? PAINTS[0];
    const slant = (random() - 0.35) * 0.3;
    const turn = (random() - 0.5) * 0.6;
    if (glyph) {
      for (const stroke of glyph.strokes) {
        brushStroke(
          context,
          place(stroke, cursor, top, letter, slant, turn),
          letter * 0.13,
          paint,
          random,
        );
      }
      cursor += glyph.width * letter * 0.82 + size * (0.26 + random() * 0.24);
    } else {
      context.save();
      context.translate(cursor, top + letter);
      context.rotate(turn * 0.4);
      context.fillStyle = `rgba(${paint}, 0.9)`;
      context.font = `900 ${Math.round(letter)}px ${HAND_FONT}`;
      context.fillText(raw, 0, 0);
      cursor += context.measureText(raw).width + size * 0.2;
      context.restore();
    }
  }
  return cursor;
}
