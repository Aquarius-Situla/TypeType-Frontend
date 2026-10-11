import { useEffect, useRef, useState } from "react";

const DURATION_MS = 650;

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 4;
}

export function useAnimatedNumber<Element extends HTMLElement | SVGElement>(
  target: number,
  fromZero = false,
) {
  const ref = useRef<Element>(null);
  const [shown, setShown] = useState(fromZero ? 0 : target);
  const shownRef = useRef(shown);
  const [visible, setVisible] = useState(!fromZero);

  useEffect(() => {
    if (visible) return;
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const from = shownRef.current;
    if (from === target || prefersReducedMotion()) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const next = from + (target - from) * easeOut(progress);
      shownRef.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, visible]);

  return { ref, value: shown };
}

export function AnimatedNumber({
  value,
  format,
  fromZero = false,
  className,
}: {
  value: number;
  format: (value: number) => string;
  fromZero?: boolean;
  className?: string;
}) {
  const animated = useAnimatedNumber<HTMLSpanElement>(value, fromZero);
  return (
    <span ref={animated.ref} className={`tabular-nums ${className ?? ""}`}>
      {/* Screen readers get the final value once, not every frame of the motion. */}
      <span aria-hidden="true">{format(animated.value)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

export function useEntered(): boolean {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    // Two frames, so the empty state is painted before the transition starts.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);
  return entered;
}
