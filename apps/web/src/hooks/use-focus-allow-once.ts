import { useState } from "react";
import type { FocusAllowOnceChallengeResponse } from "../lib/api-focus";
import {
  type FocusBlockCode,
  isAllowOnceExhausted,
  resolveAllowOnceErrorKind,
  shouldShowAllowOnceAction,
} from "../lib/focus-allow-once";
import { m } from "../paraglide/messages.js";
import { useFocus, useRequestFocusAllowOnceChallenge, useVerifyFocusAllowOnce } from "./use-focus";

export type FocusAllowOncePromptState = {
  visible: boolean;
  exhausted: boolean;
  remainingToday: number;
  requesting: boolean;
  submitting: boolean;
  challenge: FocusAllowOnceChallengeResponse | null;
  errorMessage: string | null;
  openChallenge: () => void;
  submitCode: (code: string) => void;
  dismiss: () => void;
};

export function useFocusAllowOncePrompt(
  videoUrl: string | undefined,
  effectiveCode: FocusBlockCode,
  onSuccess?: () => void,
): FocusAllowOncePromptState {
  const { query: focusQuery } = useFocus();
  const requestChallenge = useRequestFocusAllowOnceChallenge();
  const verifyAllowOnce = useVerifyFocusAllowOnce();
  const [challenge, setChallenge] = useState<FocusAllowOnceChallengeResponse | null>(null);
  const [errorKind, setErrorKind] = useState<"invalid_captcha" | "exhausted" | "generic" | null>(
    null,
  );

  const visible = shouldShowAllowOnceAction(videoUrl, effectiveCode);
  const remainingToday = focusQuery.data?.allowOnceRemainingToday ?? challenge?.remainingToday ?? 3;
  const exhausted = isAllowOnceExhausted(focusQuery.data?.allowOnceRemainingToday);

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
      { videoUrl },
      {
        onSuccess: (next) => setChallenge(next),
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
      { challengeId: challenge.challengeId, videoUrl, code: inputCode },
      {
        onSuccess: () => {
          setChallenge(null);
          onSuccess?.();
        },
        onError: (err) => {
          const kind = resolveAllowOnceErrorKind(err);
          setErrorKind(kind);
          if (kind === "invalid_captcha") fetchChallenge(true);
        },
      },
    );
  }

  function dismiss() {
    setChallenge(null);
    setErrorKind(null);
  }

  return {
    visible,
    exhausted,
    remainingToday,
    requesting: requestChallenge.isPending,
    submitting: verifyAllowOnce.isPending || requestChallenge.isPending,
    challenge,
    errorMessage,
    openChallenge: () => fetchChallenge(false),
    submitCode,
    dismiss,
  };
}
