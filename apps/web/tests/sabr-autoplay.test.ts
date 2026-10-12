import { expect, test } from "bun:test";
import {
  confirmAutoplayOnPlaying,
  guardAutoplay,
  isAutoplayPolicyError,
  SabrAutoplayAttempt,
  SabrAutoplayDeadline,
} from "../src/lib/sabr-autoplay";
import { registerSabrVidstackControls } from "../src/lib/sabr-vidstack-bridge";

test("stops automatic playback retries after a browser policy rejection", () => {
  expect(isAutoplayPolicyError(new DOMException("Play is not allowed", "NotAllowedError"))).toBe(
    true,
  );
});

test("allows transient playback failures to be retried", () => {
  expect(isAutoplayPolicyError(new DOMException("Media is not ready", "InvalidStateError"))).toBe(
    false,
  );
});

test("keeps one autoplay attempt while browser playback is pending", () => {
  const attempt = new SabrAutoplayAttempt();

  expect(attempt.begin()).toBe(true);
  expect(attempt.begin()).toBe(false);
  expect(attempt.isConfirmed).toBe(false);
});

test("expires a browser playback attempt that remains pending", () => {
  const attempt = new SabrAutoplayAttempt();
  attempt.begin();

  expect(attempt.expire()).toBe(true);
  expect(attempt.isConfirmed).toBe(true);
  expect(attempt.resolve()).toBe(false);
  expect(attempt.begin()).toBe(false);
  expect(attempt.expire()).toBe(false);
});

test("accepts playback that resolves before the deadline", () => {
  const attempt = new SabrAutoplayAttempt();
  attempt.begin();

  expect(attempt.resolve()).toBe(true);
  expect(attempt.isConfirmed).toBe(true);
});

test("confirms a user gesture before autoplay begins", () => {
  const attempt = new SabrAutoplayAttempt();

  attempt.allow();

  expect(attempt.isConfirmed).toBe(true);
  expect(attempt.begin()).toBe(false);
  expect(attempt.expire()).toBe(false);
});

test("cancels a pending autoplay deadline after a user gesture", () => {
  const attempt = new SabrAutoplayAttempt();
  attempt.begin();

  attempt.allow();

  expect(attempt.isConfirmed).toBe(true);
  expect(attempt.expire()).toBe(false);
  expect(attempt.resolve()).toBe(false);
});

test("pauses a late playback event until user playback is allowed", () => {
  let listener = () => {};
  let pauses = 0;
  const target = {
    addEventListener: (_type: "play", next: () => void) => {
      listener = next;
    },
    removeEventListener: (_type: "play", next: () => void) => {
      if (listener === next) listener = () => {};
    },
    closest: () => null,
  };
  const attempt = new SabrAutoplayAttempt();
  attempt.begin();
  attempt.expire();
  const unguard = guardAutoplay(target as unknown as HTMLVideoElement, attempt, () => {
    pauses += 1;
  });

  listener();
  attempt.allow();
  listener();
  unguard();
  listener();

  expect(pauses).toBe(1);
});

test("allows transient seek playback after autoplay expires", () => {
  let listener = () => {};
  let pauses = 0;
  let transient = true;
  const target = {
    addEventListener: (_type: "play", next: () => void) => {
      listener = next;
    },
    removeEventListener: () => {},
    closest: () => null,
  };
  const attempt = new SabrAutoplayAttempt();
  attempt.begin();
  attempt.expire();
  const video = target as unknown as HTMLVideoElement;
  const unregister = registerSabrVidstackControls(video, {
    play: async () => {},
    pause: () => {},
    seek: () => {},
    isApplyingTransientMediaState: () => transient,
  });
  guardAutoplay(video, attempt, () => {
    pauses += 1;
  });

  listener();
  transient = false;
  listener();
  unregister();

  expect(pauses).toBe(1);
});

test("allows late playback only after a player surface click", () => {
  let playListener = () => {};
  const rootListeners = new Map<string, (event: Event) => void>();
  let pauses = 0;
  const root = {
    addEventListener: (type: string, next: (event: Event) => void) => {
      rootListeners.set(type, next);
    },
    removeEventListener: () => {},
  };
  const target = {
    addEventListener: (_type: "play", next: () => void) => {
      playListener = next;
    },
    removeEventListener: () => {},
    closest: () => root,
  };
  const attempt = new SabrAutoplayAttempt();
  attempt.begin();
  attempt.expire();
  guardAutoplay(target as unknown as HTMLVideoElement, attempt, () => {
    pauses += 1;
  });

  playListener();
  rootListeners.get("click")?.({ target: root } as unknown as Event);
  playListener();

  expect(pauses).toBe(1);
});

test("allows touch playback without a compatibility click", () => {
  let playListener = () => {};
  const rootListeners = new Map<string, (event: Event) => void>();
  let pauses = 0;
  const root = {
    addEventListener: (type: string, next: (event: Event) => void) => {
      rootListeners.set(type, next);
    },
    removeEventListener: () => {},
  };
  const target = {
    addEventListener: (_type: "play", next: () => void) => {
      playListener = next;
    },
    removeEventListener: () => {},
    closest: () => root,
  };
  const attempt = new SabrAutoplayAttempt();
  attempt.begin();
  attempt.expire();
  guardAutoplay(target as unknown as HTMLVideoElement, attempt, () => {
    pauses += 1;
  });

  playListener();
  rootListeners.get("pointerup")?.({ target: root } as unknown as Event);
  playListener();

  expect(pauses).toBe(1);
});

test("cancels an armed autoplay deadline", async () => {
  let expirations = 0;
  const deadline = new SabrAutoplayDeadline(() => {
    expirations += 1;
  }, 5);

  deadline.arm();
  deadline.clear();
  await Bun.sleep(10);

  expect(expirations).toBe(0);
});

test("confirms playback before the pending play promise deadline", async () => {
  const video = new EventTarget() as HTMLVideoElement;
  const attempt = new SabrAutoplayAttempt();
  let expirations = 0;
  const deadline = new SabrAutoplayDeadline(() => {
    expirations += 1;
    attempt.expire();
  }, 5);

  attempt.begin();
  const unconfirm = confirmAutoplayOnPlaying(video, attempt, deadline);
  deadline.arm();
  video.dispatchEvent(new Event("playing"));
  await Bun.sleep(10);
  unconfirm();

  expect(expirations).toBe(0);
  expect(attempt.isConfirmed).toBe(true);
  expect(attempt.isExpired).toBe(false);
});

test("stops autoplay after a browser policy rejection", () => {
  const attempt = new SabrAutoplayAttempt();
  attempt.begin();

  expect(attempt.reject(new DOMException("Play is not allowed", "NotAllowedError"))).toBe(false);
  expect(attempt.isConfirmed).toBe(true);
  expect(attempt.begin()).toBe(false);
});

test("retries autoplay after a transient playback failure", () => {
  const attempt = new SabrAutoplayAttempt();
  attempt.begin();

  expect(attempt.reject(new DOMException("Media is not ready", "InvalidStateError"))).toBe(true);
  expect(attempt.begin()).toBe(true);
});
