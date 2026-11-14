// The stage of the skip button's acts: one button, moved by hand inside the ad frame, plus what an
// act needs to know (sizes, where the pointer is) and to clean up after itself.

const ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>';
// Room left for the control bar along the bottom of the frame.
const BAR = 64;
const EDGE = 6;
const FAR = -999;

// How close the pointer gets before an act reacts.
export const SKIP_NEAR = 85;

export type SkipAct = (stage: SkipStage) => void;

export type SkipStage = {
  frame: HTMLElement;
  btn: HTMLButtonElement;
  label: string;
  countdown: (seconds: number) => string;
  x: number;
  y: number;
  // Pointer position inside the frame, far away while it is outside.
  px: number;
  py: number;
  alive: boolean;
  onMove: () => void;
  size: () => { W: number; H: number; w: number; h: number };
  // Moves the button, kept inside the frame and clear of the control bar.
  place: (x: number, y: number) => void;
  // Moves the button anywhere, even out of the frame.
  free: (x: number, y: number) => void;
  center: () => { cx: number; cy: number };
  dist: () => number;
  later: (run: () => void, ms: number) => void;
  // Calls `run` on every frame with the seconds since the last one and the seconds since the start.
  loop: (run: (dt: number, t: number) => void) => void;
  // Shows the plain label with its icon again.
  showLabel: () => void;
  // Registers an extra element (a decoy) to remove with the stage.
  own: (element: Element) => void;
  dispose: () => void;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function createSkipStage(
  frame: HTMLElement,
  btn: HTMLButtonElement,
  label: string,
  countdown: (seconds: number) => string,
): SkipStage {
  const timers: number[] = [];
  const owned: Element[] = [];
  let frameRequest = 0;
  // The stage ignores pointer events so the ad stays clickable: the pointer is read on its parent.
  const surface = frame.parentElement ?? frame;

  const stage: SkipStage = {
    frame,
    btn,
    label,
    countdown,
    x: 0,
    y: 0,
    px: FAR,
    py: FAR,
    alive: true,
    onMove: () => undefined,
    size: () => ({
      W: frame.clientWidth,
      H: frame.clientHeight,
      w: btn.offsetWidth,
      h: btn.offsetHeight,
    }),
    place: (x, y) => {
      const { W, H, w, h } = stage.size();
      stage.free(clamp(x, EDGE, W - w - EDGE), clamp(y, EDGE, H - h - BAR));
    },
    free: (x, y) => {
      stage.x = x;
      stage.y = y;
      btn.style.left = `${x}px`;
      btn.style.top = `${y}px`;
    },
    center: () => {
      const { w, h } = stage.size();
      return { cx: stage.x + w / 2, cy: stage.y + h / 2 };
    },
    dist: () => {
      const { cx, cy } = stage.center();
      return Math.hypot(stage.px - cx, stage.py - cy);
    },
    later: (run, ms) => {
      timers.push(window.setTimeout(() => stage.alive && run(), ms));
    },
    loop: (run) => {
      const start = performance.now();
      let last = start;
      const tick = (now: number) => {
        if (!stage.alive) return;
        run(Math.min(0.05, (now - last) / 1000), (now - start) / 1000);
        last = now;
        frameRequest = window.requestAnimationFrame(tick);
      };
      frameRequest = window.requestAnimationFrame(tick);
    },
    showLabel: () => {
      btn.innerHTML = "";
      btn.append(document.createTextNode(label));
      btn.insertAdjacentHTML("beforeend", ICON);
    },
    own: (element) => {
      owned.push(element);
    },
    dispose: () => {
      stage.alive = false;
      for (const timer of timers) window.clearTimeout(timer);
      window.cancelAnimationFrame(frameRequest);
      surface.removeEventListener("pointermove", track);
      surface.removeEventListener("pointerdown", track);
      surface.removeEventListener("pointerleave", leave);
      for (const animation of btn.getAnimations()) animation.cancel();
      for (const element of owned) element.remove();
    },
  };

  function track(event: PointerEvent) {
    const box = frame.getBoundingClientRect();
    stage.px = event.clientX - box.left;
    stage.py = event.clientY - box.top;
    stage.onMove();
  }
  function leave() {
    stage.px = FAR;
    stage.py = FAR;
  }
  surface.addEventListener("pointermove", track);
  surface.addEventListener("pointerdown", track);
  surface.addEventListener("pointerleave", leave);

  stage.showLabel();
  const { W, H, w, h } = stage.size();
  stage.place(W - w - 14, H - h - BAR);
  return stage;
}

// Depth: the shadow spreads and softens as the button lifts off the picture (0 flat, 1 high).
export function liftSkip(btn: HTMLElement, height: number): void {
  btn.style.setProperty("--ad-sy", `${4 + height * 22}px`);
  btn.style.setProperty("--ad-sx", `${height * 8}px`);
  btn.style.setProperty("--ad-sb", `${5 + height * 16}px`);
  btn.style.setProperty("--ad-so", `${0.55 - height * 0.25}`);
}
