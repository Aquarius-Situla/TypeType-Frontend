import { useId } from "react";

const CANOPY = "M2 11a10 9 0 0 1 20 0Z";
const STRIPES = ["#ef4444", "#f97316", "#facc15", "#38bdf8"];

export function ParachuteIcon({ className }: { className?: string }) {
  const clipId = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d={CANOPY} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {STRIPES.map((color, index) => (
          <rect key={color} x={2 + index * 5} y={2} width={5} height={9} fill={color} />
        ))}
      </g>
      <path
        d="M2 11l8 8M22 11l-8 8M12 11v8"
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <rect x="9.5" y="18.5" width="5" height="4" rx="1" fill="#b45309" />
    </svg>
  );
}
