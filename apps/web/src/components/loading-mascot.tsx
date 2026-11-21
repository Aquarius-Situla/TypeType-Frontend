import type { JSX } from "react";
import { useResolvedTheme } from "../hooks/use-resolved-theme";
import {
  LOADING_MASCOT_DIMENSIONS,
  type LoadingMascotVariant,
  loadingMascotSrc,
} from "../lib/loading-mascot";
import { TymeMascotCard } from "./tyme-mascot-card";

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
  normal: "h-auto w-auto max-h-[min(82%,149px)] max-w-[min(82%,160px)] object-contain",
  "video-landscape": "h-auto w-auto max-h-[min(86%,457px)] max-w-[min(92%,640px)] object-contain",
  "video-portrait": "h-auto w-auto max-h-[min(86%,457px)] max-w-[min(90%,360px)] object-contain",
};

export function LoadingMascot({
  variant,
  surface = "fill",
  size,
  className = "",
}: Props): JSX.Element {
  const theme = useResolvedTheme();
  const src = loadingMascotSrc(variant, theme);
  const { width, height } = LOADING_MASCOT_DIMENSIONS[variant];

  if (surface === "overlay") {
    return (
      <TymeMascotCard
        darkSrc={loadingMascotSrc(variant, "dark")}
        lightSrc={loadingMascotSrc(variant, "light")}
        width={width}
        height={height}
        className={`${OVERLAY_WIDTH_CLASSES[variant]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[#fdfefe] dark:bg-[#15181f] ${className}`}
    >
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
