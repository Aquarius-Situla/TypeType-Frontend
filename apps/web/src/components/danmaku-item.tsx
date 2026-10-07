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
            animationDelay: `${-Math.max(0, elapsedMs)}ms`,
            animationTimingFunction: "linear",
            animationFillMode: "forwards",
            animationPlayState: paused ? "paused" : "running",
            "--d-width": `${containerWidth}px`,
          } as React.CSSProperties
        }
      >
        {comment.text}
      </span>
    );
  }

  if (comment.position === "TOP" || comment.position === "SUPERCHAT") {
    return (
      <span
        style={{
          ...BASE,
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
