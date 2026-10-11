import { type RefObject, useEffect, useRef } from "react";
import { WALK } from "../corridor/corridor-config";
import { visibleSegments } from "../corridor/corridor-range";
import { finaleFrame } from "../corridor/finale";
import { STAIRS_TOP_X } from "../corridor/stairs-layout";
import { tension } from "../corridor/tension";
import { NO_INPUT, type StepEvent, type WalkInput } from "../corridor/walker";
import type { DistantSounds } from "../distant-sounds";
import { lampLevel } from "../flashlight";
import { watchKeyLayout } from "../key-labels";
import { useLightsOutStore } from "../lights-out-store";
import { pointerCaptured } from "../pointer-capture";
import { watchContext } from "./context-watch";
import { createCorridorEvents } from "./corridor-events";
import { CorridorHint } from "./corridor-hint";
import { CorridorSubtitle } from "./corridor-subtitle";
import { createDescent } from "./descent-director";
import { gazeAtScreen } from "./screen-gaze";
import { createWatcherDirector } from "./watcher-director";
import { type CorridorWorld, createCorridorWorld } from "./world";

const PEERING_PACE = 0.3;

type Props = {
  input: RefObject<WalkInput>;
  sounds: RefObject<DistantSounds | null>;
  onStep: (step: NonNullable<StepEvent>) => void;
  onContextDead: () => void;
};

function ThreeCorridor({ input, sounds, onStep, onContextDead }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leaving = useLightsOutStore((state) => state.phase === "restoring");
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const onDeadRef = useRef(onContextDead);
  onDeadRef.current = onContextDead;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let world: CorridorWorld | null = null;
    let disposed = false;
    let frame = 0;
    const descent = createDescent(sounds);
    const director = createWatcherDirector(sounds, (segment, now) => world?.slam(segment, now));
    const events = createCorridorEvents(sounds);
    const stopLayout = watchKeyLayout();
    let frozen = false;
    let peering = false;
    const look = { yaw: 0, pitch: 0 };
    let held: { yaw: number; pitch: number } | null = null;
    let last = performance.now();
    let shown = "";

    const turn = (event: MouseEvent): void => {
      if (!pointerCaptured() || held || events.steering()) return;
      look.yaw += event.movementX * WALK.mouseSensitivity;
      look.pitch = Math.max(
        -WALK.maxPitch,
        Math.min(WALK.maxPitch, look.pitch - event.movementY * WALK.mouseSensitivity),
      );
    };

    const tick = (now: number): void => {
      if (!world) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const move = descent.update(
        frozen || events.springs() ? NO_INPUT : events.steer(input.current, look, dt),
        look,
        dt,
        now,
        peering ? PEERING_PACE : 1,
      );
      const finale = finaleFrame(move.finale);
      if (finale) {
        held ??= { yaw: look.yaw, pitch: look.pitch };
        Object.assign(look, gazeAtScreen(held, move, finale.recentre));
      }
      const walker = move.walker;
      const segments = visibleSegments(walker.distance);
      if (segments.join(",") !== shown) {
        shown = segments.join(",");
        world.syncSegments(segments);
      }

      const { view, focus, held: watched, peeking } = director.update(walker, now);
      frozen = watched;
      peering = peeking;
      const { lampOn, lampChangedAt } = useLightsOutStore.getState();
      const torch = lampLevel(lampOn, lampChangedAt, now) * move.torch;
      const { ringing, trap, toys } = events.update(
        {
          walker,
          eye: move.eye,
          input: input.current,
          look,
          watched,
          peeking,
          lit: torch > 0.3,
          finale: move.finale,
        },
        dt,
        now,
      );
      const step = trap?.own ? trap.step : move.step;
      if (step) onStepRef.current(step);
      if (!finale?.meme.track && !events.springs())
        sounds.current?.close.tension(
          tension({
            focus,
            watched: watched || Boolean(trap?.view),
            alarm: ringing?.siren ?? false,
            shaking: move.shake > 0,
            onStairs: move.inner.x > STAIRS_TOP_X,
            blind: move.torch === 0,
            screenOn: move.screen !== null,
            faceShown: (finale?.face ?? 0) > 0,
          }),
          now,
        );

      world.render({
        eye: trap?.own ? trap.eye : move.eye,
        yaw: walker.yaw,
        pitch: walker.pitch,
        lamp: torch * (ringing?.lamp ?? 1) * toys.lamp * (trap?.view ? 0 : 1),
        now,
        watcher: view,
        focus,
        stairDoor: move.stairDoor,
        sealed: move.sealed,
        shake: move.shake + (trap?.shake ?? 0),
        screen: move.screen,
        finale,
        alarm: ringing,
        fade: trap?.fade ?? 0,
        nursery: trap?.view ?? null,
        toys: toys.toys,
      });
      frame = requestAnimationFrame(tick);
    };

    const resize = (): void => world?.resize();
    void createCorridorWorld(canvas).then((created) => {
      if (disposed) {
        created.dispose();
        return;
      }
      world = created;
      frame = requestAnimationFrame(tick);
    });
    addEventListener("mousemove", turn);
    addEventListener("resize", resize);
    const stopWatch = watchContext(canvas, () => onDeadRef.current());
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      world?.dispose();
      events.dispose();
      stopLayout();
      removeEventListener("mousemove", turn);
      removeEventListener("resize", resize);
      stopWatch();
    };
  }, [input, sounds]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 z-[55] h-full w-full bg-black transition-opacity duration-700 ${leaving ? "opacity-0" : "opacity-100"}`}
      />
      <CorridorHint />
      <CorridorSubtitle />
    </>
  );
}

export default ThreeCorridor;
