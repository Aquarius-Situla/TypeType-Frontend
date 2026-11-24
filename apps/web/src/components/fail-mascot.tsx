import type { JSX } from "react";
import { FAIL_MASCOT_DIMENSIONS, failMascotSrc } from "../lib/fail-mascot";

type Props = {
  className?: string;
};

export function FailMascot({ className = "w-44 sm:w-52" }: Props): JSX.Element {
  return (
    <img
      src={failMascotSrc()}
      width={FAIL_MASCOT_DIMENSIONS.width}
      height={FAIL_MASCOT_DIMENSIONS.height}
      alt=""
      className={`block h-auto object-contain ${className}`}
    />
  );
}
