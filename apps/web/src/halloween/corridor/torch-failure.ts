import { STAIRS, STAIRS_TOP_X } from "./stairs-layout";

export const TORCH_DIES_X = STAIRS_TOP_X + STAIRS.flightRun * 4.5;

export function torchLevel(diedAt: number | null): number {
  return diedAt === null ? 1 : 0;
}
