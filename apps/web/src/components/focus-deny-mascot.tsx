import type { JSX } from "react";
import { FOCUS_DENY_DIMENSIONS, focusDenyMascotSrc } from "../lib/focus-deny-mascot";

type Props = {
  className?: string;
};

export function FocusDenyMascot({ className = "w-44 shrink-0 sm:w-52" }: Props): JSX.Element {
  return (
    <img
      src={focusDenyMascotSrc()}
      width={FOCUS_DENY_DIMENSIONS.width}
      height={FOCUS_DENY_DIMENSIONS.height}
      alt=""
      className={`block h-auto object-contain ${className}`}
    />
  );
}
