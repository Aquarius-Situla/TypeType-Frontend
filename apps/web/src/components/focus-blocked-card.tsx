import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { useAddFocusStudyChannel, useFocus, useRemoveFocusStudyChannel } from "../hooks/use-focus";
import { useSubscriptions } from "../hooks/use-subscriptions";
import { ApiError } from "../lib/api";
import { remainingCoolingOffHours } from "../lib/focus-block-error";
import { m } from "../paraglide/messages.js";

type Props = {
  code: "focus_channel_blocked" | "focus_study_pending" | "focus_entertainment_blocked";
  channelUrl?: string;
  channelName?: string;
  channelAvatarUrl?: string;
  unlockAt?: number | null;
  darkSurface?: boolean;
};

export function FocusBlockedCard({
  code,
  channelUrl = "",
  channelName = "",
  channelAvatarUrl = "",
  unlockAt = null,
  darkSurface = false,
}: Props) {
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

  const description = (() => {
    if (effectiveCode === "focus_entertainment_blocked") {
      return m.focus_blocked_entertainment();
    }
    if (effectiveCode === "focus_study_pending" && effectiveUnlockAt) {
      return m.focus_blocked_pending({ hours: remainingCoolingOffHours(effectiveUnlockAt) });
    }
    if (effectiveCode === "focus_study_active") {
      return m.focus_blocked_study_active();
    }
    if (!hasStudyGroup && channelUrl) {
      return m.focus_blocked_no_study_group();
    }
    return m.focus_blocked_outside_study();
  })();

  const activeError = addStudyChannel.error ?? removeStudyChannel.error;
  const errorMessage = (() => {
    if (!activeError) return null;
    if (activeError instanceof ApiError && activeError.code === "focus_entertainment_conflict") {
      return m.focus_entertainment_conflict();
    }
    return m.ui_action_failed();
  })();

  const containerClass = darkSurface
    ? "flex max-w-md flex-col items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-5 py-4 text-center"
    : "flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-4";

  function handleConfirmAdd() {
    setConfirmOpen(false);
    setCancelledPending(false);
    removeStudyChannel.reset();
    addStudyChannel.mutate({
      channelUrl,
      name: channelName,
      avatarUrl: channelAvatarUrl,
    });
  }

  function handleCancelPending() {
    addStudyChannel.reset();
    removeStudyChannel.mutate(channelUrl, {
      onSuccess: () => {
        setCancelledPending(true);
      },
    });
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
      {canAddStudy && (
        <button
          type="button"
          disabled={addStudyChannel.isPending}
          onClick={() => setConfirmOpen(true)}
          className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            darkSurface
              ? "bg-white text-zinc-950 hover:bg-zinc-200"
              : "bg-fg text-app hover:bg-fg-strong"
          }`}
        >
          {addStudyChannel.isPending
            ? m.ui_adding()
            : alreadySubscribed
              ? m.focus_add_study_channel_only()
              : m.focus_add_study_channel()}
        </button>
      )}
      {canCancelPending && (
        <button
          type="button"
          disabled={removeStudyChannel.isPending}
          onClick={handleCancelPending}
          className={`cursor-pointer rounded-md border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            darkSurface
              ? "border-white/25 text-white hover:bg-white/10"
              : "border-border-strong text-fg hover:bg-surface-strong"
          }`}
        >
          {removeStudyChannel.isPending ? m.ui_saving() : m.focus_cancel_study_channel()}
        </button>
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
      {errorMessage && (
        <p role="alert" className="text-xs text-danger-strong">
          {errorMessage}
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
    </div>
  );
}

function AddStudyConfirmDialog({
  channelName,
  alreadySubscribed,
  onConfirm,
  onCancel,
}: {
  channelName: string;
  alreadySubscribed: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const previousFocus = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    cancelRef.current?.focus();
    return () => {
      element?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(28rem,90vw)] rounded-lg border border-border-strong bg-surface p-5 text-left text-fg backdrop:bg-black/60"
    >
      <h2 id={titleId} className="text-base font-semibold">
        {m.focus_add_study_confirm_title()}
      </h2>
      <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-fg-muted">
        {alreadySubscribed
          ? channelName
            ? m.focus_add_study_only_confirm_description_named({ channel: channelName })
            : m.focus_add_study_only_confirm_description()
          : channelName
            ? m.focus_add_study_confirm_description_named({ channel: channelName })
            : m.focus_add_study_confirm_description()}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-md border border-border-strong px-4 py-1.5 text-sm font-medium text-fg transition-colors hover:bg-surface-strong"
        >
          {m.portability_cancel()}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="cursor-pointer rounded-md bg-fg px-4 py-1.5 text-sm font-medium text-app transition-colors hover:bg-fg-strong"
        >
          {m.focus_add_study_confirm_action()}
        </button>
      </div>
    </dialog>
  );
}
