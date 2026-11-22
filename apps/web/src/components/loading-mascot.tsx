import type { JSX } from "react";
import {
  LOADING_MASCOT_DIMENSIONS,
  type LoadingMascotVariant,
  loadingMascotSrc,
} from "../lib/loading-mascot";

type Props = {
  variant: LoadingMascotVariant;
  surface?: "fill" | "overlay";
  size?: number;
  className?: string;
};

const OVERLAY_WIDTH_CLASSES: Record<LoadingMascotVariant, string> = {
  normal: "w-24 sm:w-28",
  "video-landscape": "w-40 sm:w-48",
  "video-portrait": "w-28 sm:w-32",
};

const FILL_IMAGE_CLASSES: Record<LoadingMascotVariant, string> = {
  normal: "h-auto w-auto max-h-[min(82%,160px)] max-w-[min(82%,160px)] object-contain",
  "video-landscape": "h-auto w-auto max-h-[min(86%,480px)] max-w-[min(92%,640px)] object-contain",
  "video-portrait": "h-auto w-auto max-h-[min(86%,480px)] max-w-[min(90%,360px)] object-contain",
};

export function LoadingMascot({
  variant,
  surface = "fill",
  size,
  className = "",
}: Props): JSX.Element {
  const src = loadingMascotSrc(variant);
  const { width, height } = LOADING_MASCOT_DIMENSIONS[variant];

  if (surface === "overlay") {
    return (
      <img
        src={src}
        width={width}
        height={height}
        alt=""
        className={`loading-mascot block h-auto object-contain ${OVERLAY_WIDTH_CLASSES[variant]} ${className}`}
      />
    );
  }

  return (
    <div className={`flex h-full w-full items-center justify-center ${className}`}>
      <img
        src={src}
        width={size ?? width}
        height={size ? Math.round((size * height) / width) : height}
        alt=""
        style={size ? { width: size, height: "auto" } : undefined}
        className={`loading-mascot ${size ? "object-contain" : FILL_IMAGE_CLASSES[variant]}`}
      />
    </div>
  );
}
