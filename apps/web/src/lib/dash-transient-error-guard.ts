const DOWNLOAD_ERROR_ID_SIDX_CODE = 26;
const DOWNLOAD_ERROR_ID_CONTENT_CODE = 27;
const DOWNLOAD_ERROR_ID_INITIALIZATION_CODE = 28;
const TRANSIENT_DASH_ERROR_CODES = new Set([
  DOWNLOAD_ERROR_ID_SIDX_CODE,
  DOWNLOAD_ERROR_ID_CONTENT_CODE,
  DOWNLOAD_ERROR_ID_INITIALIZATION_CODE,
]);
const MAX_CONSECUTIVE_TRANSIENT_ERRORS = 3;
const TRANSIENT_ERROR_STALL_MS = 60_000;

export function dashErrorCode(detail: unknown): number | null {
  if (typeof detail !== "object" || detail === null || !("error" in detail)) return null;
  const error = detail.error;
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  return typeof error.code === "number" ? error.code : null;
}

export function isTransientDashError(detail: unknown): boolean {
  const code = dashErrorCode(detail);
  return code !== null && TRANSIENT_DASH_ERROR_CODES.has(code);
}

export class DashTransientErrorGuard {
  private failures = 0;
  private stallTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly escalate: () => void;
  private readonly stallMs: number;

  constructor(escalate: () => void, stallMs = TRANSIENT_ERROR_STALL_MS) {
    this.escalate = escalate;
    this.stallMs = stallMs;
  }

  absorb(
    detail: unknown,
    online = typeof navigator === "undefined" || navigator.onLine !== false,
  ): boolean {
    if (!isTransientDashError(detail)) return false;
    // Offline, dash.js has given up on the segment: the player error waits for the network and reloads then.
    if (!online) {
      this.reset();
      return false;
    }
    this.failures += 1;
    if (this.failures >= MAX_CONSECUTIVE_TRANSIENT_ERRORS) {
      this.reset();
      return false;
    }
    this.stallTimer ??= setTimeout(() => {
      this.reset();
      this.escalate();
    }, this.stallMs);
    return true;
  }

  recordProgress(): void {
    this.reset();
  }

  reset(): void {
    this.failures = 0;
    if (this.stallTimer !== null) clearTimeout(this.stallTimer);
    this.stallTimer = null;
  }
}
