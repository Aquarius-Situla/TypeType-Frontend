import type { JSX } from "react";
import { FAIL_MASCOT_DIMENSIONS, failMascotSrc } from "../lib/fail-mascot";
import type { ResolvedTheme } from "../stores/theme-store";
import { TymeMascotCard } from "./tyme-mascot-card";

type Props = {
  theme?: ResolvedTheme;
  className?: string;
};

export function FailMascot({ theme, className = "w-44 sm:w-52" }: Props): JSX.Element {
  return (
    <TymeMascotCard
      darkSrc={failMascotSrc("dark")}
      lightSrc={failMascotSrc("light")}
      width={FAIL_MASCOT_DIMENSIONS.width}
      height={FAIL_MASCOT_DIMENSIONS.height}
      theme={theme}
      className={className}
    />
  );
}
