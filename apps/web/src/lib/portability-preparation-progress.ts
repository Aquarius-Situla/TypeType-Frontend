type PortabilityPreparationPhase = "scanning" | "extracting" | "packing" | "uploading";
export type PortabilityPreparationProgress = {
  ownerId: string;
  phase: PortabilityPreparationPhase;
  processed: number;
  total: number | null;
};

let current: PortabilityPreparationProgress | null = null;
const listeners = new Set<() => void>();

export function getPortabilityPreparationProgress(): PortabilityPreparationProgress | null {
  return current;
}

export function subscribePortabilityPreparationProgress(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPortabilityPreparationProgress(progress: PortabilityPreparationProgress): void {
  current = progress;
  for (const listener of listeners) listener();
}

export function clearPortabilityPreparationProgress(ownerId: string): void {
  if (current?.ownerId !== ownerId) return;
  current = null;
  for (const listener of listeners) listener();
}
