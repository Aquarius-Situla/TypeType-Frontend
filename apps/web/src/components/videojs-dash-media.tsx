import { type DashAdapter, DashVideo } from "@videojs/react/media/dash-video";
import { type ReactNode, useCallback, useMemo } from "react";
import { attachBilibiliDash } from "../lib/dash-bilibili-behaviour";
import { registerDashPlayer } from "../lib/dash-player-registration";
import { buildDashStreamingSettings } from "../lib/dash-streaming-settings";
import type { Provider } from "../lib/provider";
import type { VideoJsMediaElementProps } from "./videojs-media-props";

type Props = VideoJsMediaElementProps & {
  src: string;
  provider?: Provider;
  children: ReactNode;
};

export default function VideoJsDashMedia({ src, provider, mediaRef, mediaProps, children }: Props) {
  const source = useMemo(
    () => ({ src, engine: { dashJs: { streaming: buildDashStreamingSettings(provider) } } }),
    [src, provider],
  );
  const onAdapter = useCallback(
    (adapter: DashAdapter | null) => {
      registerDashPlayer(adapter?.engine ?? null);
      if (adapter && provider === "bilibili") attachBilibiliDash(adapter.engine);
    },
    [provider],
  );
  return (
    <DashVideo ref={mediaRef} mediaRef={onAdapter} {...mediaProps} source={source}>
      {children}
    </DashVideo>
  );
}
