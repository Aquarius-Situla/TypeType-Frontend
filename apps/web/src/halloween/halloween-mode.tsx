import { useQueryClient } from "@tanstack/react-query";
import { type ComponentType, useCallback, useState } from "react";
import { useMobile } from "../hooks/use-mobile";
import { useSettings } from "../hooks/use-settings";
import { loadGallery } from "./gallery-source";
import { useGallery } from "./gallery-store";
import { HalloweenButton } from "./halloween-button";
import { HalloweenIntro } from "./halloween-intro";
import { useLightsOutStore } from "./lights-out-store";

type Runtime = ComponentType<{ onFinished: () => void }>;

export function HalloweenMode() {
  const phase = useLightsOutStore((state) => state.phase);
  const [intro, setIntro] = useState(false);
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [running, setRunning] = useState(false);
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const isMobile = useMobile();
  const close = useCallback((): void => setIntro(false), []);
  const finish = useCallback((): void => setRunning(false), []);
  if (isMobile && phase === "idle") return null;

  const open = (): void => {
    setIntro(true);
    useGallery.getState().setItems([]);
    if (!settings.hideHomeRecommendations) {
      void loadGallery(queryClient, settings.defaultService, settings.hideHomeRecommendations).then(
        useGallery.getState().setItems,
      );
    }
    void import("./halloween-runtime").then((module) => setRuntime(() => module.HalloweenRuntime));
  };
  const enter = (): void => {
    setIntro(false);
    setRunning(true);
  };
  const Active = running ? runtime : null;

  return (
    <>
      <HalloweenButton onOpen={open} />
      {intro && <HalloweenIntro ready={runtime !== null} onEnter={enter} onClose={close} />}
      {Active && <Active onFinished={finish} />}
    </>
  );
}
