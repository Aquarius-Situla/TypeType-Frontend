import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAuth } from "../hooks/use-auth";
import { usePersistedPortabilityJob } from "../hooks/use-persisted-portability-job";
import { usePortabilityJob } from "../hooks/use-portability-job";
import type { PortabilityCategory, PortabilityJob } from "../lib/api-portability";
import {
  getPortabilityPreparationProgress,
  subscribePortabilityPreparationProgress,
} from "../lib/portability-preparation-progress";
import { SUBSCRIPTION_FEED_KEY } from "../lib/subscription-queries";
import { m } from "../paraglide/messages.js";
import { getLocale } from "../paraglide/runtime.js";
import { portabilityImportStageLabel } from "./portability-job-status";
import { PortabilityPreparationToast } from "./portability-preparation-toast";
import "../styles/notification-toast.css";

const REFRESH_INTERVAL_MS = 2_000;
const IMPORT_QUERY_KEYS = [
  ["subscriptions"],
  SUBSCRIPTION_FEED_KEY,
  ["playlists"],
  ["saved-playlists"],
  ["history"],
  ["history-all"],
  ["favorites"],
  ["watch-later"],
];

function queryKeysForCategory(category: PortabilityCategory | null | undefined) {
  if (category === "subscriptions") return [["subscriptions"], SUBSCRIPTION_FEED_KEY];
  if (category === "playlists") return [["playlists"], ["saved-playlists"]];
  if (category === "history") return [["history"], ["history-all"]] as const;
  if (category === "favorites") return [["favorites"]];
  if (category === "watchLater") return [["watch-later"]];
  return [];
}

function percent(job: PortabilityJob): number | null {
  const progress = job.progress;
  if (!progress?.total || progress.total <= 0) return null;
  return Math.min(100, Math.round((progress.processed / progress.total) * 100));
}

export function PortabilityProgressHost() {
  const { isAuthed, me } = useAuth();
  const queryClient = useQueryClient();
  const [jobId, setJobId] = usePersistedPortabilityJob("typetype-portability-import-job");
  const preparation = useSyncExternalStore(
    subscribePortabilityPreparationProgress,
    getPortabilityPreparationProgress,
    getPortabilityPreparationProgress,
  );
  const localPreparation = isAuthed && preparation?.ownerId === me?.id ? preparation : null;
  const job = usePortabilityJob(isAuthed ? jobId : null);
  const [finished, setFinished] = useState(false);
  const wasRunning = useRef(false);
  const observedJobId = useRef(jobId);
  const seenCheckpoint = useRef(0);
  const refreshTimes = useRef(new Map<PortabilityCategory, number>());
  const refreshedOnTerminal = useRef<string | null>(null);
  const state = job.data?.state;
  const active =
    isAuthed &&
    job.data?.kind === "import" &&
    (state === "queued" || state === "analyzing" || state === "applying");
  const visible = isAuthed && (localPreparation !== null || active || finished);

  useEffect(() => {
    if (!job.missing || !jobId) return;
    setJobId(null);
    setFinished(false);
  }, [job.missing, jobId, setJobId]);

  useEffect(() => {
    if (observedJobId.current !== jobId) {
      observedJobId.current = jobId;
      wasRunning.current = false;
      seenCheckpoint.current = 0;
      refreshTimes.current.clear();
      refreshedOnTerminal.current = null;
      setFinished(false);
    }
    if (active) {
      wasRunning.current = true;
      setFinished(false);
      return;
    }
    if (!wasRunning.current || !state || !["completed", "failed", "cancelled"].includes(state))
      return;
    wasRunning.current = false;
    setFinished(true);
    const timer = window.setTimeout(() => setFinished(false), 6_000);
    return () => window.clearTimeout(timer);
  }, [active, jobId, state]);

  useEffect(() => {
    const checkpoint = job.data?.progress?.checkpoint ?? 0;
    if (!active || checkpoint <= seenCheckpoint.current) return;
    seenCheckpoint.current = checkpoint;
    const category = job.data?.progress?.category;
    if (!category) return;
    const refreshedAt = refreshTimes.current.get(category) ?? 0;
    if (Date.now() - refreshedAt < REFRESH_INTERVAL_MS) return;
    refreshTimes.current.set(category, Date.now());
    void Promise.all(
      queryKeysForCategory(category).map((queryKey) =>
        queryClient.invalidateQueries({ queryKey: [...queryKey] }),
      ),
    );
  }, [active, job.data?.progress?.category, job.data?.progress?.checkpoint, queryClient]);

  useEffect(() => {
    const value = job.data;
    if (
      value?.kind !== "import" ||
      !["completed", "failed", "cancelled"].includes(value.state) ||
      refreshedOnTerminal.current === value.id
    ) {
      return;
    }
    refreshedOnTerminal.current = value.id;
    void Promise.all(
      IMPORT_QUERY_KEYS.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey: [...queryKey] }),
      ),
    );
  }, [job.data, queryClient]);

  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.dataset.portabilityProgressVisible = "true";
    else delete root.dataset.portabilityProgressVisible;
    return () => {
      delete root.dataset.portabilityProgressVisible;
    };
  }, [visible]);

  const value = job.data;
  const progress = value?.progress;
  const stage = progress?.stage;
  const progressPercent = value ? percent(value) : null;
  const locale = getLocale();

  if (localPreparation) return <PortabilityPreparationToast progress={localPreparation} />;
  if (!value || !visible) return null;
  const activeJob = ["queued", "analyzing", "applying"].includes(value.state);
  const title =
    value.state === "queued"
      ? m.portability_job_waiting({}, { locale })
      : value.state === "analyzing"
        ? m.portability_job_analyzing({}, { locale })
        : value.state === "failed"
          ? m.portability_job_failed({}, { locale })
          : value.state === "cancelled"
            ? m.portability_job_cancelled({}, { locale })
            : value.state === "completed"
              ? m.portability_job_import_completed({}, { locale })
              : m.portability_job_importing({}, { locale });
  const detail = stage ? portabilityImportStageLabel(stage, progress?.category, locale) : title;
  const progressText = progress
    ? progress.total != null
      ? m.portability_progress_of(
          {
            processed: progress.processed.toLocaleString(),
            total: progress.total.toLocaleString(),
          },
          { locale },
        )
      : progress.processed.toLocaleString()
    : null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="notification-toast portability-progress-toast"
    >
      <div className="flex items-center gap-2.5 p-2">
        {activeJob ? (
          <LoaderCircle
            size={17}
            className="shrink-0 animate-spin text-accent"
            aria-hidden="true"
          />
        ) : value.state === "failed" ? (
          <AlertTriangle size={17} className="shrink-0 text-danger" aria-hidden="true" />
        ) : (
          <CheckCircle2 size={17} className="shrink-0 text-accent" aria-hidden="true" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] font-semibold uppercase text-accent">
            {title}
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-medium leading-tight text-fg">
            {detail}
          </span>
          {progressText && (
            <span className="mt-1 block text-[11px] text-fg-muted">
              {progressText} {m.portability_progress_records({}, { locale })}
            </span>
          )}
        </span>
        {activeJob ? (
          <button
            type="button"
            onClick={() => job.cancel.mutate()}
            disabled={job.cancel.isPending}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-fg-soft hover:text-fg disabled:opacity-40"
            aria-label={m.portability_cancel({}, { locale })}
            title={m.portability_cancel({}, { locale })}
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : (
          <CheckCircle2 size={15} className="shrink-0 text-fg-soft" aria-hidden="true" />
        )}
      </div>
      {activeJob && (
        <div
          className="h-1.5 overflow-hidden bg-surface-strong"
          role="progressbar"
          aria-label={detail}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent ?? undefined}
        >
          <div
            className={`h-full bg-accent transition-[width] duration-300 ${progressPercent === null ? "w-1/3 animate-pulse" : ""}`}
            style={progressPercent === null ? undefined : { width: `${progressPercent}%` }}
          />
        </div>
      )}
    </aside>
  );
}
