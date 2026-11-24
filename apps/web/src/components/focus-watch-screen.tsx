import { useRouter } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useFocusAiReview } from "../hooks/use-focus-ai-review";
import { useFocusAllowOncePrompt } from "../hooks/use-focus-allow-once";
import type { FocusBlockInfo } from "../lib/focus-block-error";
import { m } from "../paraglide/messages.js";
import { FocusAiReviewPanel } from "./focus-ai-review-panel";
import { FocusBlockedCard } from "./focus-blocked-card";
import { FocusCoolingCountdown } from "./focus-cooling-countdown";
import { FocusDenyMascot } from "./focus-deny-mascot";
import { FocusRestMascot } from "./focus-rest-mascot";

type Props = {
  focusBlock: FocusBlockInfo;
  message: string;
  videoUrl?: string;
  onSuccess?: () => void;
};

export function FocusWatchScreen({
  focusBlock,
  message,
  videoUrl,
  onSuccess,
}: Props): ReactElement {
  const router = useRouter();
  const allowOnce = useFocusAllowOncePrompt({
    videoUrl,
    effectiveCode: focusBlock.code,
    kindOverride: focusBlock.allowOnceKind,
    initialCooldownMs: focusBlock.allowOnceCooldownMs,
    initialPendingUnlockAt: focusBlock.allowOncePendingUnlockAt,
    onSuccess,
  });
  const aiReview = useFocusAiReview(
    focusBlock,
    videoUrl,
    allowOnce.pendingUnlockAt,
    onSuccess,
    allowOnce.setCooldownMs,
  );

  if (aiReview.phase === "question" && !allowOnce.pendingUnlockAt) {
    return (
      <FocusAiReviewPanel
        isRewatch={focusBlock.code === "focus_entertainment_rewatch_blocked"}
        videoTitle={focusBlock.videoTitle}
        submitting={aiReview.submitting}
        onSubmit={aiReview.submitReason}
      />
    );
  }

  const heading = (() => {
    if (aiReview.phase === "rejected") return m.focus_ai_rejected();
    if (aiReview.phase === "unavailable") return m.focus_ai_unavailable_title();
    return m.focus_blocked_title();
  })();

  const subMessage = aiReview.phase === "unavailable" ? m.focus_ai_unavailable() : message;

  return (
    <div className="dark-surface fixed inset-0 flex flex-col items-center justify-center gap-5 bg-app px-4">
      <div className="flex flex-col items-center gap-2">
        {aiReview.phase === "unavailable" ? (
          <FocusRestMascot className="w-52 shrink-0 sm:w-64" />
        ) : (
          <FocusDenyMascot className="w-44 shrink-0 sm:w-52" />
        )}
        {allowOnce.pendingUnlockAt && (
          <FocusCoolingCountdown unlockAt={allowOnce.pendingUnlockAt} onComplete={onSuccess} />
        )}
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-base font-semibold tracking-tight text-white">{heading}</p>
        <p className="max-w-xs text-center text-sm text-fg-muted">{subMessage}</p>
      </div>
      <FocusBlockedCard
        code={focusBlock.code}
        channelUrl={focusBlock.channelUrl}
        channelName={focusBlock.channelName}
        channelAvatarUrl={focusBlock.channelAvatarUrl}
        unlockAt={focusBlock.unlockAt}
        videoUrl={videoUrl}
        onAllowOnceSuccess={onSuccess}
        allowOnceState={allowOnce}
        darkSurface
      />
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="cursor-pointer rounded-md bg-surface-strong px-5 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface-soft"
        >
          {m.not_found_back()}
        </button>
      </div>
    </div>
  );
}
