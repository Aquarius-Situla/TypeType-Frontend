import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { HalloweenStage } from "./halloween-stage";
import { useLightsOutStore } from "./lights-out-store";
import { useLightsOut } from "./use-lights-out";

type Props = {
  onFinished: () => void;
};

export function HalloweenRuntime({ onFinished }: Props) {
  const lights = useLightsOut();
  const { start } = lights;
  const phase = useLightsOutStore((state) => state.phase);
  const begun = useRef(false);
  const finished = useRef(onFinished);
  finished.current = onFinished;

  useEffect(() => start(), [start]);

  useEffect(() => {
    if (phase !== "idle") begun.current = true;
    else if (begun.current) finished.current();
  }, [phase]);

  return createPortal(<HalloweenStage lights={lights} />, document.body);
}
