import { ApiError } from "./api";

const TERMINAL_STATES = new Set(["ready", "completed", "failed", "cancelled"]);

export function shouldPollPortabilityJob(error: unknown, state: string | undefined): boolean {
  if (error instanceof ApiError && error.status === 404) return false;
  return state === undefined || !TERMINAL_STATES.has(state);
}
