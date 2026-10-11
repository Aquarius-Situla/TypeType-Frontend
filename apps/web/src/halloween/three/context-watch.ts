const RESTORE_WAIT_MS = 1500;

export function watchContext(canvas: HTMLCanvasElement, onDead: () => void): () => void {
  let timer = 0;
  const lost = (): void => {
    clearTimeout(timer);
    timer = window.setTimeout(onDead, RESTORE_WAIT_MS);
  };
  const restored = (): void => clearTimeout(timer);
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  return () => {
    clearTimeout(timer);
    canvas.removeEventListener("webglcontextlost", lost);
    canvas.removeEventListener("webglcontextrestored", restored);
  };
}
