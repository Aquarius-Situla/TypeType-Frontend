import { useEffect, useRef } from "react";
import { paintDarkness } from "./darkness-paint";
import { useLightsOutStore } from "./lights-out-store";

const FOLLOW = 0.35;

export function DarknessCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = useLightsOutStore((state) => state.phase !== "idle" && state.phase !== "loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!active || !canvas || !ctx) return;
    const pointer = { x: innerWidth / 2, y: innerHeight / 2 };
    const lamp = { ...pointer };
    let frame = 0;

    const resize = (): void => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.round(innerWidth * dpr);
      canvas.height = Math.round(innerHeight * dpr);
    };
    const track = (event: PointerEvent): void => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };
    const draw = (now: number): void => {
      lamp.x += (pointer.x - lamp.x) * FOLLOW;
      lamp.y += (pointer.y - lamp.y) * FOLLOW;
      const scale = canvas.width / innerWidth;
      paintDarkness(ctx, { x: lamp.x * scale, y: lamp.y * scale }, now);
      frame = requestAnimationFrame(draw);
    };

    resize();
    addEventListener("resize", resize);
    addEventListener("pointermove", track);
    addEventListener("pointerdown", track);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", track);
      removeEventListener("pointerdown", track);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />
  );
}
