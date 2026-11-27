import type { VideoHTMLAttributes } from "react";

export type VideoJsMediaProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, "preload"> & {
  preload?: "auto" | "metadata" | "none";
};

export type VideoJsMediaElementProps = {
  mediaRef: (element: HTMLVideoElement | null) => void;
  mediaProps: VideoJsMediaProps;
};
