import type { JSX } from "react";
import { useLayoutEffect } from "react";
import { holdAppLoader } from "../lib/app-loader";
import { LoadingMascot } from "./loading-mascot";

type Props = {
  fullScreen?: boolean;
};

export function PageSpinner({ fullScreen = true }: Props): JSX.Element {
  const size = fullScreen ? 160 : 96;
  const wrapperClass = fullScreen
    ? "fixed inset-0 z-50 bg-app"
    : "dark-surface h-full w-full bg-app";

  // While the startup screen is still up, it stands in for this spinner.
  useLayoutEffect(() => (fullScreen ? holdAppLoader() : undefined), [fullScreen]);

  return <LoadingMascot variant="normal" surface="fill" size={size} className={wrapperClass} />;
}
