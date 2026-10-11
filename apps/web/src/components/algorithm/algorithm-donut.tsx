import { ChevronRight } from "lucide-react";
import { type MouseEvent, useState } from "react";
import { GAP, RADIUS, SHADES, VIEW, WIDTH } from "./algorithm-donut-geometry";
import { formatPercent } from "./algorithm-labels";
import { AnimatedNumber, useEntered } from "./animated-number";

export type DonutPart = { id: string; label: string; value: number };

const percent = (value: number) => formatPercent(value / 100);

export function Donut({
  parts,
  centerValue,
  formatCenter,
  centerLabel,
  unit,
  size = VIEW,
  onSelect,
}: {
  parts: DonutPart[];
  centerValue: number;
  formatCenter: (value: number) => string;
  centerLabel: string;
  unit?: (value: number) => string;
  size?: number;
  onSelect?: (id: string) => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const drawn = useEntered();

  const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0);
  const nonZero = parts.filter((part) => part.value > 0).length;
  const circumference = 2 * Math.PI * RADIUS;
  let offset = 0;
  const arcs = parts.map((part, index) => {
    const share = total > 0 ? Math.max(0, part.value) / total : 0;
    const length = share > 0 ? Math.max(0, share - (nonZero > 1 ? GAP : 0)) * circumference : 0;
    const arc = {
      part,
      color: SHADES[index % SHADES.length],
      length: drawn ? length : 0,
      start: drawn ? offset * circumference : 0,
      share,
    };
    offset += share;
    return arc;
  });
  const focused = arcs.find((arc) => arc.part.id === active);

  function partAt(event: MouseEvent<HTMLElement>): string | null {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * VIEW - VIEW / 2;
    const y = ((event.clientY - box.top) / box.height) * VIEW - VIEW / 2;
    if (Math.abs(Math.hypot(x, y) - RADIUS) > WIDTH) return null;
    const turn = ((Math.atan2(y, x) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI)) * RADIUS;
    const hit = arcs.find(
      (arc) =>
        arc.length > 0 && turn >= arc.start && turn <= arc.start + arc.length + GAP * circumference,
    );
    return hit?.part.id ?? null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-5 py-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          aria-hidden="true"
          className="block"
        >
          <circle
            cx={VIEW / 2}
            cy={VIEW / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={WIDTH}
            className="stroke-surface-strong"
          />
          {arcs.map((arc) => (
            <circle
              key={arc.part.id}
              cx={VIEW / 2}
              cy={VIEW / 2}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              transform={`rotate(-90 ${VIEW / 2} ${VIEW / 2})`}
              className="algorithm-arc"
              style={{
                strokeWidth: active === arc.part.id ? WIDTH + 4 : WIDTH,
                strokeDasharray: `${arc.length} ${circumference}`,
                strokeDashoffset: -arc.start,
                opacity: active && active !== arc.part.id ? 0.35 : 1,
              }}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span
            className={`font-semibold text-fg ${size > VIEW ? "text-3xl" : "text-lg"}`}
            aria-live="polite"
          >
            {focused ? (
              <AnimatedNumber value={focused.share * 100} format={percent} />
            ) : (
              <AnimatedNumber value={centerValue} format={formatCenter} fromZero />
            )}
          </span>
          <span className={`line-clamp-2 text-fg-soft ${size > VIEW ? "text-xs" : "text-[10px]"}`}>
            {focused ? focused.part.label : centerLabel}
          </span>
        </div>
        {onSelect && (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className={`absolute inset-0 rounded-full ${active ? "cursor-pointer" : "cursor-default"}`}
            onMouseMove={(event) => setActive(partAt(event))}
            onMouseLeave={() => setActive(null)}
            onClick={(event) => {
              const id = partAt(event);
              if (id) onSelect(id);
            }}
          />
        )}
      </div>
      <ul className="flex min-w-56 max-w-md flex-1 flex-col gap-0.5">
        {arcs
          .filter((arc) => arc.share > 0)
          .map((arc) => (
            <li key={arc.part.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(arc.part.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(arc.part.id)}
                onBlur={() => setActive(null)}
                onClick={onSelect ? () => onSelect(arc.part.id) : undefined}
                className={`group flex min-h-9 w-full items-center gap-2.5 rounded-sm px-1.5 text-left text-sm transition-[opacity,background-color] duration-200 ${
                  onSelect ? "hover:bg-surface-strong" : "cursor-default"
                } ${active && active !== arc.part.id ? "opacity-40" : ""}`}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: arc.color }}
                />
                <span className="min-w-0 flex-1 truncate text-fg">{arc.part.label}</span>
                {unit && (
                  <AnimatedNumber
                    value={arc.part.value}
                    format={(value) => unit(Math.round(value))}
                    className="shrink-0 text-xs text-fg-muted"
                  />
                )}
                <AnimatedNumber
                  value={arc.share * 100}
                  format={percent}
                  className="w-10 shrink-0 text-right text-xs text-fg-soft"
                />
                {onSelect && (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-fg-soft transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-fg"
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}
