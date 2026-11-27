export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return Boolean(
    target.closest(
      "a, button, input, textarea, select, summary, [contenteditable='true'], [role='button'], [role='menuitem'], [role='slider']",
    ),
  );
}

export function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest("input, textarea, select, [contenteditable='true']") !== null
  );
}

// A button of the player keeps the player shortcuts, as in Vidstack: closing the settings leaves the focus on its
// button, and < or k must still work. Fields, controls outside the player, and the player menus and sliders keep
// their keys.
export function blocksPlayerShortcut(
  target: EventTarget | null,
  player: HTMLElement | null,
): boolean {
  if (!isInteractiveTarget(target)) return false;
  if (isEditableTarget(target)) return true;
  if (!(target instanceof Element) || !player?.contains(target)) return true;
  return target.closest("[role='menu'], [role='menuitem'], [role='slider']") !== null;
}

export function isPlayerSeekShortcutTarget(
  target: EventTarget | null,
  player: HTMLElement | null,
): boolean {
  if (!isInteractiveTarget(target)) return true;
  if (!(target instanceof Element) || !player?.contains(target)) return false;
  const slider = target.closest<HTMLElement>("[role='slider']");
  if (slider && !slider.classList.contains("vds-time-slider")) return false;
  return !target.closest(
    "input, textarea, select, [contenteditable='true'], [role='menu'], [role='menuitem'], [role='listbox'], [role='option']",
  );
}

export function clampTime(value: number, duration: number): number {
  const max = duration > 0 ? duration : Number.POSITIVE_INFINITY;
  return Math.min(max, Math.max(0, value));
}

export function keyboardSeekOffset(code: string): number | null {
  if (code === "ArrowLeft" || code === "KeyJ") return -10;
  if (code === "ArrowRight" || code === "KeyL") return 10;
  return null;
}

// Read by key position like YouTube: the top-row digits type "&é\"'(" without Shift on AZERTY layouts.
export function keyboardSeekPercent(code: string): number | null {
  const digit = /^(?:Digit|Numpad)([0-9])$/.exec(code);
  return digit ? Number(digit[1]) * 10 : null;
}

const MIN_KEYBOARD_RATE = 0.25;
const MAX_KEYBOARD_RATE = 4;

// < and > step the speed like the Vidstack shortcuts, within the speeds the menus offer.
export function nextKeyboardRate(current: number, delta: number): number {
  const next = Math.round((current + delta) * 100) / 100;
  return Math.min(MAX_KEYBOARD_RATE, Math.max(MIN_KEYBOARD_RATE, next));
}

export function isPlaybackToggleShortcut(code: string): boolean {
  return code === "KeyK";
}

export type KeyboardSeekTarget = {
  position: number;
  updatedAt: number;
};

export function nextKeyboardSeekTarget(
  currentTime: number,
  duration: number,
  offset: number,
  previous: KeyboardSeekTarget,
  now: number,
): KeyboardSeekTarget {
  const base = now - previous.updatedAt <= 1_000 ? previous.position : currentTime;
  return { position: clampTime(base + offset, duration), updatedAt: now };
}

export function consumeEvent(event: KeyboardEvent) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

export function consumePointerEvent(event: PointerEvent) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

export function isFastForwardPointer(event: PointerEvent): boolean {
  if (event.pointerType === "mouse") return event.button === 0;
  return event.pointerType === "touch" || event.pointerType === "pen";
}

export function isMouseClickPastTap(
  pointerType: string,
  pressedMs: number,
  tapMaxMs: number | undefined,
): boolean {
  return pointerType === "mouse" && tapMaxMs !== undefined && pressedMs > tapMaxMs;
}

const DRAG_THRESHOLD = 12;

export function exceededDragThreshold(dx: number, dy: number): boolean {
  return Math.abs(dx) >= DRAG_THRESHOLD && Math.abs(dx) > Math.abs(dy);
}

export function computeScrubTarget(
  startTime: number,
  dx: number,
  width: number,
  range: number,
  duration: number,
): number {
  if (width <= 0) return clampTime(startTime, duration);
  return clampTime(startTime + (dx / width) * range, duration);
}
