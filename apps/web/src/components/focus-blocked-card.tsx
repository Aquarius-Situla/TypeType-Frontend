import { Link } from "@tanstack/react-router";
import { type ReactElement, useState } from "react";
import { useAddFocusStudyChannel, useFocus, useRemoveFocusStudyChannel } from "../hooks/use-focus";
import { useFocusAllowOncePrompt } from "../hooks/use-focus-allow-once";
import { useSubscriptions } from "../hooks/use-subscriptions";
import { ApiError } from "../lib/api";
import { remainingCoolingOffHours } from "../lib/focus-block-error";
import { m } from "../paraglide/messages.js";
import { AddStudyConfirmDialog } from "./focus-add-study-dialog";
import { FocusAllowOnceDialog } from "./focus-allow-once-dialog";
import { FocusBlockedActions } from "./focus-blocked-actions";

type Props = {
  code: "focus_channel_blocked" | "focus_study_pending" | "focus_entertainment_blocked";
  channelUrl?: string;
  channelName?: string;
  channelAvatarUrl?: string;
  unlockAt?: number | null;
  videoUrl?: string;
  onAllowOnceSuccess?: () => void;
  darkSurface?: boolean;
};

export function FocusBlockedCard({
  code,
  channelUrl = "",
  channelName = "",
  channelAvatarUrl = "",
  unlockAt = null,
  videoUrl,
  onAllowOnceSuccess,
  darkSurface = false,
}: Props): ReactElement {
  const { query: focusQuery } = useFocus();
  const { isSubscribed } = useSubscriptions();
  const addStudyChannel = useAddFocusStudyChannel();
  const removeStudyChannel = useRemoveFocusStudyChannel();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelledPending, setCancelledPending] = useState(false);

  const hasStudyGroup = Boolean(focusQuery.data?.studyGroupId);
  const alreadySubscribed = channelUrl.length > 0 && isSubscribed(channelUrl);
  const addedResult = addStudyChannel.data;

  const effectiveCode = (() => {
    if (addedResult?.status === "pending") return "focus_study_pending";
    if (addedResult?.status === "active") return "focus_study_active";
    if (cancelledPending && code === "focus_study_pending") return "focus_channel_blocked";
    return code;
  })();
  const effectiveUnlockAt = addedResult?.unlockAt ?? unlockAt;

  const canAddStudy =
    effectiveCode === "focus_channel_blocked" && channelUrl.length > 0 && hasStudyGroup;
  const canCancelPending =
    effectiveCode === "focus_study_pending" && channelUrl.length > 0 && hasStudyGroup;
  const allowOnce = useFocusAllowOncePrompt(videoUrl, effectiveCode, onAllowOnceSuccess);

  const description = (() => {
    if (effectiveCode === "focus_entertainment_blocked") return m.focus_blocked_entertainment();
    if (effectiveCode === "focus_study_pending" && effectiveUnlockAt) {
      return m.focus_blocked_pending({ hours: remainingCoolingOffHours(effectiveUnlockAt) });
    }
    if (effectiveCode === "focus_study_active") return m.focus_blocked_study_active();
    if (!hasStudyGroup && channelUrl) return m.focus_blocked_no_study_group();
    return m.focus_blocked_outside_study();
  })();

  const activeError = addStudyChannel.error ?? removeStudyChannel.error;
  const errorMessage = !activeError
    ? null
    : activeError instanceof ApiError && activeError.code === "focus_entertainment_conflict"
      ? m.focus_entertainment_conflict()
      : m.ui_action_failed();

  const containerClass = darkSurface
    ? "flex max-w-md flex-col items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-5 py-4 text-center"
    : "flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-4";

  function handleConfirmAdd() {
    setConfirmOpen(false);
    setCancelledPending(false);
    removeStudyChannel.reset();
    addStudyChannel.mutate({ channelUrl, name: channelName, avatarUrl: channelAvatarUrl });
  }

  function handleCancelPending() {
    addStudyChannel.reset();
    removeStudyChannel.mutate(channelUrl, { onSuccess: () => setCancelledPending(true) });
  }

  return (
    <div className={containerClass}>
      <div className="flex flex-col gap-1">
        {channelName && (
          <p className={`text-sm font-medium ${darkSurface ? "text-white" : "text-fg"}`}>
            {channelName}
          </p>
        )}
        <p className={`text-sm ${darkSurface ? "text-white/80" : "text-fg-soft"}`}>{description}</p>
      </div>
      <FocusBlockedActions
        darkSurface={darkSurface}
        canAddStudy={canAddStudy}
        addingStudy={addStudyChannel.isPending}
        alreadySubscribed={alreadySubscribed}
        onRequestAddStudy={() => setConfirmOpen(true)}
        canCancelPending={canCancelPending}
        cancellingPending={removeStudyChannel.isPending}
        onCancelPending={handleCancelPending}
        canAllowOnce={allowOnce.visible}
        allowOnceExhausted={allowOnce.exhausted}
        requestingAllowOnce={allowOnce.requesting}
        onRequestAllowOnce={allowOnce.openChallenge}
      />
      {allowOnce.visible && allowOnce.exhausted && (
        <p className={`text-xs ${darkSurface ? "text-white/50" : "text-fg-soft"}`}>
          {m.focus_allow_once_remaining({ count: 0 })}
        </p>
      )}
      {!hasStudyGroup && effectiveCode !== "focus_entertainment_blocked" && (
        <Link
          to="/settings"
          search={{ section: "focus" }}
          className={`text-xs underline underline-offset-2 ${darkSurface ? "text-white/80 hover:text-white" : "text-fg hover:text-fg-strong"}`}
        >
          {m.focus_open_settings()}
        </Link>
      )}
      {(errorMessage || (!allowOnce.challenge && allowOnce.errorMessage)) && (
        <p role="alert" className="text-xs text-danger-strong">
          {errorMessage ?? allowOnce.errorMessage}
        </p>
      )}
      {confirmOpen && (
        <AddStudyConfirmDialog
          channelName={channelName}
          alreadySubscribed={alreadySubscribed}
          onConfirm={handleConfirmAdd}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
      {allowOnce.challenge && (
        <FocusAllowOnceDialog
          challenge={allowOnce.challenge}
          remainingToday={allowOnce.remainingToday}
          submitting={allowOnce.submitting}
          errorMessage={allowOnce.errorMessage}
          onSubmit={allowOnce.submitCode}
          onCancel={allowOnce.dismiss}
        />
      )}
    </div>
  );
}
