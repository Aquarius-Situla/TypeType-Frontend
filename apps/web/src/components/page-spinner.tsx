import { useLayoutEffect } from "react";
import { holdAppLoader } from "../lib/app-loader";
import { ReactionGif } from "./reaction-gif";

type Props = {
  fullScreen?: boolean;
};

export function PageSpinner({ fullScreen = true }: Props) {
  const size = fullScreen ? 120 : 88;
  const wrapperClass = fullScreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-app"
    : "flex h-full w-full items-center justify-center bg-app";

  // While the startup screen is still up, it stands in for this spinner.
  useLayoutEffect(() => (fullScreen ? holdAppLoader() : undefined), [fullScreen]);

  return (
    <div className={wrapperClass}>
      <ReactionGif kind="loading" size={size} className="loading-mascot" />
    </div>
  );
}
