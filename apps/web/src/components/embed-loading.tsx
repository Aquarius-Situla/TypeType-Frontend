import type { JSX } from "react";
import { LoadingMascot } from "./loading-mascot";

export function EmbedLoading(): JSX.Element {
  return (
    <LoadingMascot
      variant="video-landscape"
      surface="fill"
      className="fixed inset-0 z-50 bg-black"
    />
  );
}
