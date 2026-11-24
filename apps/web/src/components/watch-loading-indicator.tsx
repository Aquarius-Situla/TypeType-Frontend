import type { JSX } from "react";
import { LoadingMascot } from "./loading-mascot";

type Props = {
  notice?: string;
};

export function WatchLoadingIndicator({ notice }: Props): JSX.Element {
  if (!notice) return <LoadingMascot variant="video-landscape" surface="fill" />;
  return (
    <div className="relative h-full w-full">
      <LoadingMascot variant="video-landscape" surface="fill" />
      <p
        role="status"
        className="absolute inset-x-0 bottom-4 z-10 px-4 text-center text-fg-muted text-sm"
      >
        {notice}
      </p>
    </div>
  );
}
