import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "../lib/api";
import { submitFocusAiReview } from "../lib/api-focus";
import { clientTimezone } from "../lib/client-timezone";
import type { FocusBlockInfo } from "../lib/focus-block-error";
import { useAuth } from "./use-auth";

type FocusAiPhase = "none" | "question" | "rejected" | "unavailable";

export type FocusAiLocalOutcome = "rejected" | "unavailable" | null;

export type FocusAiReviewState = {
  phase: FocusAiPhase;
  submitting: boolean;
  submitReason: (reason: string) => void;
};

export function resolveFocusAiPhase(
  focusBlock: Pick<FocusBlockInfo, "aiRejected" | "aiReviewEligible">,
  pendingUnlockAt: number | null,
  localOutcome: FocusAiLocalOutcome,
): FocusAiPhase {
  if (focusBlock.aiRejected || localOutcome === "rejected") return "rejected";
  if (localOutcome === "unavailable") return "unavailable";
  if (focusBlock.aiReviewEligible && !pendingUnlockAt) return "question";
  return "none";
}

export function useFocusAiReview(
  focusBlock: FocusBlockInfo,
  videoUrl: string | undefined,
  pendingUnlockAt: number | null,
  onApproved: (() => void) | undefined,
  onRejectedCooldown: (cooldownMs: number) => void,
): FocusAiReviewState {
  const { me } = useAuth();
  const client = useQueryClient();
  const outcomeKey = `${videoUrl ?? ""}:${focusBlock.code}`;
  const [localResult, setLocalResult] = useState<{
    key: string;
    outcome: Exclude<FocusAiLocalOutcome, null>;
  } | null>(null);
  const localOutcome = localResult?.key === outcomeKey ? localResult.outcome : null;

  const phase = resolveFocusAiPhase(focusBlock, pendingUnlockAt, localOutcome);

  const mutation = useMutation({
    mutationFn: (reason: string) =>
      submitFocusAiReview({
        videoUrl: videoUrl ?? "",
        reason,
        timezone: clientTimezone(),
      }),
    onSuccess: (response) => {
      if (response.status === "approved") {
        setLocalResult(null);
        client.invalidateQueries({ queryKey: ["focus", me?.id] });
        onApproved?.();
        return;
      }
      if (response.status === "rejected") {
        onRejectedCooldown(response.cooldownMs ?? 0);
        setLocalResult({ key: outcomeKey, outcome: "rejected" });
        return;
      }
      onRejectedCooldown(0);
      setLocalResult({ key: outcomeKey, outcome: "unavailable" });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "focus_ai_rejection_cooldown") {
        setLocalResult({ key: outcomeKey, outcome: "rejected" });
        return;
      }
      onRejectedCooldown(0);
      setLocalResult({ key: outcomeKey, outcome: "unavailable" });
    },
  });

  return {
    phase,
    submitting: mutation.isPending,
    submitReason: (reason: string) => {
      if (!videoUrl || mutation.isPending) return;
      mutation.mutate(reason.trim());
    },
  };
}
