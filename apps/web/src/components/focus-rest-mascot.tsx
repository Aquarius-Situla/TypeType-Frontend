import type { JSX } from "react";
import { FOCUS_REST_DIMENSIONS, focusRestMascotSrc } from "../lib/focus-mascots";
import { getLocale } from "../paraglide/runtime.js";

type Props = {
  className?: string;
};

export function FocusRestMascot({ className = "w-52 shrink-0 sm:w-64" }: Props): JSX.Element {
  return (
    <img
      src={focusRestMascotSrc(getLocale())}
      width={FOCUS_REST_DIMENSIONS.width}
      height={FOCUS_REST_DIMENSIONS.height}
      alt=""
      className={`block h-auto object-contain ${className}`}
    />
  );
}
