import { lazy, Suspense, useState } from "react";
import { useWalkInput } from "./corridor/use-walk-input";
import { EndCredits } from "./credits/end-credits";
import { DarknessCanvas } from "./darkness-canvas";
import { LampClickLayer } from "./lamp-click-layer";
import { useLightsOutStore } from "./lights-out-store";
import { usePointerClicks } from "./pointer-capture";
import type { LightsOutControls } from "./use-lights-out";

const ThreeCorridor = lazy(() => import("./three/three-corridor"));

const MAX_RESTARTS = 2;

type Props = {
  lights: LightsOutControls;
};

export function HalloweenStage({ lights }: Props) {
  const { stop, toggleLamp, playStep, distant } = lights;
  const phase = useLightsOutStore((state) => state.phase);
  const visitedCorridor = useLightsOutStore((state) => state.visitedCorridor);
  const input = useWalkInput(phase === "corridor");
  usePointerClicks(phase, toggleLamp);
  const [restarts, setRestarts] = useState(0);
  const restart = (): void => setRestarts((count) => Math.min(MAX_RESTARTS, count + 1));
  const showCorridor = visitedCorridor && (phase === "corridor" || phase === "restoring");
  return (
    <>
      {showCorridor && (
        <Suspense fallback={<div className="fixed inset-0 z-[55] bg-black" />}>
          <ThreeCorridor
            key={restarts}
            input={input}
            sounds={distant}
            onStep={playStep}
            onContextDead={restart}
          />
        </Suspense>
      )}
      {showCorridor && <EndCredits onDone={stop} />}
      <DarknessCanvas />
      <LampClickLayer onToggle={toggleLamp} input={input} />
    </>
  );
}
