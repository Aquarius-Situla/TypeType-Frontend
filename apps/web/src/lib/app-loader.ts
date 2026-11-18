// The startup screen of index.html: the mascot that shows while the app boots. A full-screen spinner
// that mounts right after boot looks the same, so the startup screen stays on until it is gone
// instead of handing over to a second mascot that restarts its animation somewhere else.

// Time left for a pending route to mount its spinner once the app is up.
const HANDOVER_MS = 150;
const FADE_MS = 200;

let holds = 0;
let released = false;

function startupScreen(): HTMLElement | null {
  return document.getElementById("app-loader");
}

function dismiss() {
  const screen = startupScreen();
  if (!screen || holds > 0) return;
  screen.style.transition = `opacity ${FADE_MS}ms ease-out`;
  screen.style.opacity = "0";
  screen.style.pointerEvents = "none";
  window.setTimeout(() => screen.remove(), FADE_MS);
}

// The app is up: the startup screen fades out unless a full-screen spinner is still waiting.
export function releaseAppLoader(): void {
  released = true;
  window.setTimeout(dismiss, HANDOVER_MS);
}

// Keeps the startup screen on while a full-screen spinner is mounted. Returns the release.
export function holdAppLoader(): () => void {
  if (!startupScreen()) return () => undefined;
  holds += 1;
  return () => {
    holds -= 1;
    if (released) dismiss();
  };
}
