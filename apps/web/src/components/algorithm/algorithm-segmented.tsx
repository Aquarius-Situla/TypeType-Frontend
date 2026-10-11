import { useLayoutEffect, useRef, useState } from "react";

export function Segmented<Value extends string | number | null>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: Value;
  options: { value: Value; label: string }[];
  onChange: (value: Value) => void;
}) {
  const container = useRef<HTMLFieldSetElement>(null);
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the choice changes
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => {
      const active = element.querySelector<HTMLElement>('[aria-pressed="true"]');
      setPill(
        active
          ? {
              x: active.offsetLeft,
              y: active.offsetTop,
              w: active.offsetWidth,
              h: active.offsetHeight,
            }
          : null,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return (
    <fieldset
      ref={container}
      className="relative flex max-w-full flex-wrap gap-1 rounded-md border border-border-strong bg-app p-1"
    >
      <legend className="sr-only">{label}</legend>
      {pill && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 rounded bg-surface-strong transition-[transform,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            transform: `translate(${pill.x}px, ${pill.y}px)`,
            width: pill.w,
            height: pill.h,
          }}
        />
      )}
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`relative min-h-8 whitespace-nowrap rounded px-2.5 text-xs font-medium transition-colors duration-300 ${
            value === option.value ? "text-fg" : "text-fg-muted hover:text-fg"
          }`}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
