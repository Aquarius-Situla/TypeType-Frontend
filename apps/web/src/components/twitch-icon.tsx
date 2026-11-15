import type { SVGProps } from "react";
import { siTwitch } from "simple-icons";

type Props = SVGProps<SVGSVGElement> & {
  title?: string;
};

export function TwitchIcon({ title, ...props }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...props}
    >
      <path d={siTwitch.path} />
    </svg>
  );
}
