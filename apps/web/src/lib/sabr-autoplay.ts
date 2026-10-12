import { isSabrPlaybackEventTransient } from "./sabr-vidstack-bridge";

export function isAutoplayPolicyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "NotAllowedError"
  );
}

export class SabrAutoplayAttempt {
  private confirmed = false;
  private expired = false;
  private pending = false;

  get isConfirmed(): boolean {
    return this.confirmed;
  }

  get isExpired(): boolean {
    return this.expired;
  }

  begin(): boolean {
    if (this.confirmed || this.pending) return false;
    this.pending = true;
    return true;
  }

  resolve(): boolean {
    this.pending = false;
    if (this.confirmed) return false;
    this.confirmed = true;
    return true;
  }

  expire(): boolean {
    if (this.confirmed || !this.pending) return false;
    this.pending = false;
    this.confirmed = true;
    this.expired = true;
    return true;
  }

  allow(): void {
    this.pending = false;
    this.confirmed = true;
    this.expired = false;
  }

  reject(error: unknown): boolean {
    this.pending = false;
    if (this.confirmed) return false;
    if (!isAutoplayPolicyError(error)) return true;
    this.confirmed = true;
    return false;
  }

  reset(): void {
    this.confirmed = false;
    this.expired = false;
    this.pending = false;
  }
}

export function guardAutoplay(
  video: HTMLVideoElement,
  attempt: SabrAutoplayAttempt,
  pause: () => void,
): () => void {
  const stopExpiredPlayback = () => {
    if (attempt.isExpired && !isSabrPlaybackEventTransient(video)) pause();
  };
  const root = video.closest(".typetype-player-surface");
  const allowPlayback = (event: Event) => {
    if (
      event.target === video ||
      event.target === root ||
      (event.target instanceof Element && event.target.closest(".vds-play-button"))
    )
      attempt.allow();
  };
  video.addEventListener("play", stopExpiredPlayback);
  root?.addEventListener("pointerup", allowPlayback, true);
  root?.addEventListener("click", allowPlayback, true);
  return () => {
    video.removeEventListener("play", stopExpiredPlayback);
    root?.removeEventListener("pointerup", allowPlayback, true);
    root?.removeEventListener("click", allowPlayback, true);
  };
}

export class SabrAutoplayDeadline {
  private timer: ReturnType<typeof globalThis.setTimeout> | undefined;
  private readonly onExpire: () => void;
  private readonly timeoutMs: number;

  constructor(onExpire: () => void, timeoutMs = 250) {
    this.onExpire = onExpire;
    this.timeoutMs = timeoutMs;
  }

  arm(): void {
    this.clear();
    this.timer = globalThis.setTimeout(() => {
      this.timer = undefined;
      this.onExpire();
    }, this.timeoutMs);
  }

  clear(): void {
    if (this.timer === undefined) return;
    globalThis.clearTimeout(this.timer);
    this.timer = undefined;
  }
}

export function confirmAutoplayOnPlaying(
  video: HTMLVideoElement,
  attempt: SabrAutoplayAttempt,
  deadline: SabrAutoplayDeadline,
): () => void {
  const confirm = () => {
    deadline.clear();
    attempt.resolve();
  };
  video.addEventListener("playing", confirm);
  return () => video.removeEventListener("playing", confirm);
}
