import { useEffect, useState } from "react";
import type { FocusAllowOnceChallengeResponse, FocusAllowOnceKind } from "../lib/api-focus";
import {
  allowOnceKindForCode,
  defaultDailyLimitForKind,
  type FocusBlockCode,
  isAllowOnceExhausted,
  remainingForAllowOnceKind,
  resolveAllowOnceErrorKind,
  shouldShowAllowOnceAction,
} from "../lib/focus-allow-once";
import { m } from "../paraglide/messages.js";
import {
  useCancelFocusAllowOncePending,
  useFocus,
  useRequestFocusAllowOnceChallenge,
  useVerifyFocusAllowOnce,
} from "./use-focus";

export type FocusAllowOncePromptState = {
  visible: boolean;
  exhausted: boolean;
  remainingToday: number;
  cooldownMs: number;
  pendingUnlockAt: number | null;
  cancellingPending: boolean;
  requesting: boolean;
  submitting: boolean;
  challenge: FocusAllowOnceChallengeResponse | null;
  errorMessage: string | null;
  openChallenge: () => void;
  submitCode: (code: string) => void;
  cancelPending: () => void;
  setCooldownMs: (ms: number) => void;
  dismiss: () => void;
};

type Options = {
  videoUrl: string | undefined;
  effectiveCode: FocusBlockCode;
  kindOverride?: FocusAllowOnceKind | null;
  initialCooldownMs?: number | null;
  initialPendingUnlockAt?: number | null;
  onSuccess?: () => void;
};

export function useFocusAllowOncePrompt({
  videoUrl,
  effectiveCode,
  kindOverride,
  initialCooldownMs,
  initialPendingUnlockAt,
  onSuccess,
}: Options): FocusAllowOncePromptState {
  const { query: focusQuery } = useFocus();
  const requestChallenge = useRequestFocusAllowOnceChallenge();
  const verifyAllowOnce = useVerifyFocusAllowOnce();
  const cancelPendingMutation = useCancelFocusAllowOncePending();
  const [challenge, setChallenge] = useState<FocusAllowOnceChallengeResponse | null>(null);
  const [errorKind, setErrorKind] = useState<"invalid_captcha" | "exhausted" | "generic" | null>(
    null,
  );
  const [cooldownMs, setCooldownMs] = useState<number>(initialCooldownMs ?? 0);
  const [pendingUnlockAt, setPendingUnlockAt] = useState<number | null>(
    initialPendingUnlockAt ?? null,
  );

  useEffect(() => {
    setCooldownMs(initialCooldownMs ?? 0);
  }, [initialCooldownMs]);

  useEffect(() => {
    setPendingUnlockAt(initialPendingUnlockAt ?? null);
  }, [initialPendingUnlockAt]);

  const kind = kindOverride ?? allowOnceKindForCode(effectiveCode);
  const visible = shouldShowAllowOnceAction(videoUrl, effectiveCode);
  const settingsRemaining = remainingForAllowOnceKind(focusQuery.data, kind);
  const remainingToday =
    settingsRemaining ?? challenge?.remainingToday ?? defaultDailyLimitForKind(kind);
  const exhausted = isAllowOnceExhausted(settingsRemaining);

  const errorMessage = (() => {
    if (errorKind === "invalid_captcha") return m.focus_allow_once_invalid();
    if (errorKind === "exhausted") return m.focus_allow_once_exhausted();
    if (errorKind === "generic") return m.ui_action_failed();
    return null;
  })();

  function fetchChallenge(preserveError = false) {
    if (!videoUrl) return;
    if (!preserveError) setErrorKind(null);
    requestChallenge.mutate(
      { videoUrl, kind },
      {
        onSuccess: (next) => {
          setChallenge(next);
          if (typeof next.cooldownMs === "number") setCooldownMs(next.cooldownMs);
        },
        onError: (err) => {
          if (preserveError) setChallenge(null);
          setErrorKind(resolveAllowOnceErrorKind(err));
        },
      },
    );
  }

  function submitCode(inputCode: string) {
    if (!videoUrl || !challenge) return;
    setErrorKind(null);
    verifyAllowOnce.mutate(
      { challengeId: challenge.challengeId, videoUrl, code: inputCode, kind },
      {
        onSuccess: (result) => {
          setChallenge(null);
          if (result.unlockAt && result.unlockAt > Date.now()) {
            setPendingUnlockAt(result.unlockAt);
          } else {
            onSuccess?.();
          }
        },
        onError: (err) => {
          const kindError = resolveAllowOnceErrorKind(err);
          setErrorKind(kindError);
          if (kindError === "invalid_captcha") fetchChallenge(true);
        },
      },
    );
  }

  function cancelPending() {
    if (!videoUrl) return;
    setErrorKind(null);
    cancelPendingMutation.mutate(videoUrl, {
      onSuccess: () => setPendingUnlockAt(null),
      onError: (err) => setErrorKind(resolveAllowOnceErrorKind(err)),
    });
  }

  return {
    visible,
    exhausted,
    remainingToday,
    cooldownMs: challenge?.cooldownMs ?? cooldownMs,
    pendingUnlockAt,
    cancellingPending: cancelPendingMutation.isPending,
    requesting: requestChallenge.isPending,
    submitting: verifyAllowOnce.isPending || requestChallenge.isPending,
    challenge,
    errorMessage,
    openChallenge: () => fetchChallenge(false),
    submitCode,
    cancelPending,
    setCooldownMs,
    dismiss: () => {
      setChallenge(null);
      setErrorKind(null);
    },
  };
}
