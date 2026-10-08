import { argbToColor, LANE_HEIGHT_PX, REGULAR_DISPLAY_MS } from "../lib/danmaku";
import type { BulletCommentItem } from "../types/api";

type Props = {
  comment: BulletCommentItem;
  lane: number;
  containerWidth: number;
  elapsedMs: number;
  speedMultiplier: number;
  sizeMultiplier: number;
  paused: boolean;
  playbackRate?: number;
};

const BASE: React.CSSProperties = {
  position: "absolute",
  whiteSpace: "nowrap",
  fontWeight: "bold",
  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
  pointerEvents: "none",
  userSelect: "none",
  left: "100%",
  marginLeft: "2px",
  transform: "translate3d(0, 0, 0)",
  WebkitTransform: "translate3d(0, 0, 0)",
  willChange: "transform",
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
};

export function DanmakuItem({
  comment,
  lane,
  containerWidth,
  elapsedMs,
  speedMultiplier,
  sizeMultiplier,
  paused,
  playbackRate = 1,
}: Props) {
  const color = argbToColor(comment.argbColor);
  const fontSize = Math.round(20 * comment.relativeFontSize * sizeMultiplier);
  const effectiveSpeed = speedMultiplier * playbackRate;
  const durationMs = REGULAR_DISPLAY_MS / effectiveSpeed;

  if (comment.position === "REGULAR") {
    let animDelayMs: number;
    if (elapsedMs < 0) {
      animDelayMs = Math.round(-elapsedMs / effectiveSpeed);
    } else if (elapsedMs <= 500) {
      // Natural entrance jitter buffer: start cleanly from offscreen right edge (left: 100%)
      animDelayMs = 0;
    } else {
      animDelayMs = -Math.round(elapsedMs / effectiveSpeed);
    }

    return (
      <span
        style={
          {
            ...BASE,
            color,
            fontSize: `${fontSize}px`,
            top: `${lane * LANE_HEIGHT_PX}px`,
            animationName: "danmaku-scroll",
            animationDuration: `${durationMs}ms`,
            animationDelay: `${animDelayMs}ms`,
            animationTimingFunction: "linear",
            animationFillMode: "both",
            animationPlayState: paused ? "paused" : "running",
            "--d-width": `${containerWidth}px`,
          } as React.CSSProperties
        }
      >
        {comment.text}
      </span>
    );
  }

  // Static comments (TOP, SUPERCHAT, BOTTOM) must not be rendered before their timestamp
  if (elapsedMs < 0) {
    return null;
  }

  if (comment.position === "TOP" || comment.position === "SUPERCHAT") {
    return (
      <span
        style={{
          ...BASE,
          marginLeft: 0,
          color,
          fontSize: `${fontSize}px`,
          top: `${4 + (lane % 3) * LANE_HEIGHT_PX}px`,
          left: "50%",
          transform: "translate3d(-50%, 0, 0)",
          WebkitTransform: "translate3d(-50%, 0, 0)",
        }}
      >
        {comment.text}
      </span>
    );
  }

  if (comment.position === "BOTTOM") {
    return (
      <span
        style={{
          ...BASE,
          marginLeft: 0,
          color,
          fontSize: `${fontSize}px`,
          bottom: `${4 + (lane % 3) * LANE_HEIGHT_PX}px`,
          left: "50%",
          transform: "translate3d(-50%, 0, 0)",
          WebkitTransform: "translate3d(-50%, 0, 0)",
        }}
      >
        {comment.text}
      </span>
    );
  }

  return null;
}
