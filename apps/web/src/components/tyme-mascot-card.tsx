import type { JSX } from "react";
import { useResolvedTheme } from "../hooks/use-resolved-theme";
import type { ResolvedTheme } from "../stores/theme-store";

type Props = {
  darkSrc: string;
  lightSrc: string;
  width: number;
  height: number;
  theme?: ResolvedTheme;
  className?: string;
};

export function TymeMascotCard({
  darkSrc,
  lightSrc,
  width,
  height,
  theme: themeOverride,
  className = "",
}: Props): JSX.Element {
  const resolvedTheme = useResolvedTheme();
  const theme = themeOverride ?? resolvedTheme;
  const src = theme === "dark" ? darkSrc : lightSrc;
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-[#fdfefe] shadow-2xl ring-1 ring-black/15 dark:bg-[#15181f] dark:ring-white/15 ${className}`}
    >
      <img
        src={src}
        width={width}
        height={height}
        alt=""
        className="loading-mascot block h-auto w-full object-contain"
      />
    </div>
  );
}
