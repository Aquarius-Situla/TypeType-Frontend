const TAU = Math.PI * 2;
const smoothing = (cutoff: number, rate: number): number => 1 - Math.exp((-TAU * cutoff) / rate);

function noise(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return (state / 4294967296) * 2 - 1;
  };
}

export const BREATH_SECONDS = 3.3;

export function breathSamples(rate: number): Float32Array<ArrayBuffer> {
  const out = new Float32Array(Math.round(rate * BREATH_SECONDS));
  const random = noise(7);
  let low = 0;
  let lower = 0;
  for (let i = 0; i < out.length; i += 1) {
    const t = i / rate;
    const inhale = t < 1.25 ? Math.sin((Math.PI * t) / 1.25) ** 2 : 0;
    const exhale = t > 1.45 && t < 3.25 ? Math.sin((Math.PI * (t - 1.45)) / 1.8) ** 2 : 0;
    low += (random() - low) * smoothing(inhale > 0 ? 2800 : 1500, rate);
    lower += (low - lower) * smoothing(380, rate);
    out[i] = (low - lower) * (inhale * 0.8 + exhale * 0.65);
  }
  return out;
}

export const HEARTBEAT_SECONDS = 0.7;

export function heartbeatSamples(rate: number): Float32Array<ArrayBuffer> {
  const out = new Float32Array(Math.round(rate * HEARTBEAT_SECONDS));
  const thumps = [
    { at: 0, from: 62, to: 40, decay: 0.09, level: 1 },
    { at: 0.27, from: 74, to: 48, decay: 0.07, level: 0.7 },
  ];
  for (const thump of thumps) {
    let phase = 0;
    for (let i = Math.round(thump.at * rate); i < out.length; i += 1) {
      const t = i / rate - thump.at;
      const frequency = thump.to + (thump.from - thump.to) * Math.exp(-t / 0.05);
      phase += frequency / rate;
      const envelope = Math.exp(-t / thump.decay) * (1 - Math.exp(-t / 0.004));
      out[i] = (out[i] ?? 0) + Math.sin(TAU * phase) * envelope * thump.level * 0.9;
    }
  }
  return out;
}

const FALL_SECONDS = 1.4;

export function fallSamples(rate: number): Float32Array<ArrayBuffer> {
  const out = new Float32Array(Math.round(rate * FALL_SECONDS));
  const random = noise(23);
  let low = 0;
  let lower = 0;
  for (let i = 0; i < out.length; i += 1) {
    const t = i / rate;
    const rush = Math.min(1, t / FALL_SECONDS) ** 1.6;
    low += (random() - low) * smoothing(300 + 2600 * rush, rate);
    lower += (low - lower) * smoothing(90, rate);
    const gust = 0.8 + 0.2 * Math.sin(TAU * 7 * t + Math.sin(TAU * 1.3 * t) * 3);
    out[i] = (low - lower) * rush * gust * 1.6;
  }
  return out;
}

const THUD_SECONDS = 1.1;

export function thudSamples(rate: number): Float32Array<ArrayBuffer> {
  const out = new Float32Array(Math.round(rate * THUD_SECONDS));
  const random = noise(41);
  let phase = 0;
  let crack = 0;
  for (let i = 0; i < out.length; i += 1) {
    const t = i / rate;
    const frequency = 38 + 70 * Math.exp(-t / 0.05);
    phase += frequency / rate;
    const body = Math.sin(TAU * phase) * Math.exp(-t / 0.22) * (1 - Math.exp(-t / 0.002));
    crack += (random() - crack) * smoothing(1800, rate);
    const debris = crack * Math.exp(-t / 0.08) * 0.6;
    out[i] = Math.tanh((body + debris) * 1.6) * 0.85;
  }
  return out;
}
