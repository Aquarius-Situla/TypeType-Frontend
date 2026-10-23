import type { PreviewFrameItem } from "../types/api";

interface JsonVttCue {
  startTime: number;
  endTime: number;
  text: string;
}

export function buildThumbnailVtt(
  frames: PreviewFrameItem[],
  durationSeconds?: number,
): string | null {
  if (frames.length === 0) return null;

  const cues: JsonVttCue[] = [];
  let currentTimeMs = 0;

  for (const frame of frames) {
    const { urls, frameWidth, frameHeight, framesPerPageX, framesPerPageY, durationPerFrame } =
      frame;

    for (const url of urls) {
      const framesOnSheet = framesPerPageX * framesPerPageY;
      for (let i = 0; i < framesOnSheet; i++) {
        const col = i % framesPerPageX;
        const row = Math.floor(i / framesPerPageX);
        const x = col * frameWidth;
        const y = row * frameHeight;
        const startMs = currentTimeMs;
        const endMs = currentTimeMs + durationPerFrame;
        cues.push({
          startTime: startMs / 1000,
          endTime: endMs / 1000,
          text: `${url}#xywh=${x},${y},${frameWidth},${frameHeight}`,
        });
        currentTimeMs = endMs;
      }
    }
  }

  if (cues.length === 0) return null;

  if (durationSeconds && durationSeconds > cues[cues.length - 1].endTime) {
    cues[cues.length - 1].endTime = durationSeconds;
  }

  const blob = new Blob([JSON.stringify(cues)], { type: "application/json" });
  return URL.createObjectURL(blob);
}
