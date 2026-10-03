import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArchiveRestore } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { usePendingYoutubeTakeout } from "../hooks/use-pending-youtube-takeout";
import { usePersistedPortabilityJob } from "../hooks/use-persisted-portability-job";
import { usePortabilityJob } from "../hooks/use-portability-job";
import {
  applyPortabilityImport,
  downloadPortabilityReport,
  type PortabilityCategory,
  type PortabilityFormatDescriptor,
  type PortabilityJob,
  startPortabilityImport,
} from "../lib/api-portability";
import { invalidateSubscriptionQueries } from "../lib/subscription-queries";
import { m } from "../paraglide/messages.js";
import { PortabilityFormatPicker } from "./portability-format-picker";
import { PortabilityImportGuide } from "./portability-import-guide";
import { PortabilityImportPreview } from "./portability-import-preview";
import { PortabilityImportSourcePicker } from "./portability-import-source-picker";
import { PortabilityJobStatus } from "./portability-job-status";
import { Toast } from "./toast";

export function PortabilityImportPanel({ formats }: { formats: PortabilityFormatDescriptor[] }) {
  const { me } = useAuth();
  const ownerId = me?.id;
  const [pendingTakeout, setPendingTakeout] = usePendingYoutubeTakeout(ownerId);
  const queryClient = useQueryClient();
  const importFormats = useMemo(
    () =>
      formats.filter((format) =>
        format.capabilities.some((item) => item.directions.includes("import")),
      ),
    [formats],
  );
  const [formatName, setFormatName] = useState("auto");
  const [jobId, setJobId] = usePersistedPortabilityJob("typetype-portability-import-job");
  const [toast, setToast] = useState<string | null>(null);
  const previousState = useRef<string | null>(null);
  const autoAppliedJobId = useRef<string | null>(null);
  const job = usePortabilityJob(jobId);
  const selectedFormat = importFormats.find((item) => item.format === formatName);
  const upload = useMutation({
    mutationFn: ({ file, prepared }: { file: File; prepared: boolean }) =>
      startPortabilityImport(file, formatName, {
        ownerId,
        preparedFile: prepared ? file : undefined,
        onPrepared: setPendingTakeout,
        onAccepted: (started) => {
          setJobId(started.id);
          queryClient.setQueryData(["portability-job", started.id], started);
        },
      }),
    onSuccess: (started) => queryClient.setQueryData(["portability-job", started.id], started),
  });
  const apply = useMutation({
    mutationFn: (categories: PortabilityCategory[]) =>
      applyPortabilityImport(jobId as string, categories, "skip"),
    onSuccess: (updated) =>
      queryClient.setQueryData<PortabilityJob>(["portability-job", jobId], updated),
    onError: () => {
      autoAppliedJobId.current = null;
    },
  });
  const report = useMutation({ mutationFn: () => downloadPortabilityReport(jobId as string) });

  useEffect(() => {
    const data = job.data;
    if (data?.state !== "ready" || !data.preview || autoAppliedJobId.current === data.id) {
      return;
    }
    const categories = Object.keys(data.preview.counts) as PortabilityCategory[];
    if (categories.length === 0) return;
    autoAppliedJobId.current = data.id;
    apply.mutate(categories);
  }, [apply.mutate, job.data]);

  useEffect(() => {
    const state = job.data?.state ?? null;
    if (state === "completed" && previousState.current !== "completed") {
      void invalidateSubscriptionQueries(queryClient);
      const count = Object.values(job.data?.result ?? {}).reduce((sum, value) => sum + value, 0);
      setToast(
        `${m.portability_import_completed()}: ${count.toLocaleString()} ${m.portability_items()}`,
      );
    }
    previousState.current = state;
  }, [job.data?.result, job.data?.state, queryClient]);

  useEffect(() => {
    if (!job.missing || !jobId) return;
    queryClient.removeQueries({ queryKey: ["portability-job", jobId] });
    setJobId(null);
    setToast(m.portability_stale_job_toast());
  }, [job.missing, jobId, queryClient, setJobId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function choose(file: File | undefined, prepared = false) {
    if (file && !upload.isPending) upload.mutate({ file, prepared });
  }

  function reset() {
    if (jobId) void job.remove.mutateAsync().catch(() => undefined);
    setJobId(null);
    autoAppliedJobId.current = null;
    upload.reset();
    apply.reset();
  }

  if (importFormats.length === 0)
    return <p className="text-sm text-fg-muted">{m.portability_no_import_format()}</p>;

  const preview = job.data?.preview;
  const failure = upload.error ?? job.error ?? apply.error ?? report.error;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <ArchiveRestore size={20} className="shrink-0 text-fg" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-fg">{m.portability_import_title()}</h2>
          <p className="text-xs text-fg-soft">{m.portability_import_description()}</p>
        </div>
      </div>
      {!jobId && (
        <>
          <PortabilityFormatPicker
            label={m.portability_import_from()}
            formats={[{ format: "auto", defaultExtension: "" }, ...importFormats]}
            value={formatName}
            onChange={setFormatName}
          />
          <PortabilityImportGuide format={formatName} />
          {pendingTakeout && (formatName === "auto" || formatName === "youtube-takeout") && (
            <button
              type="button"
              disabled={upload.isPending}
              onClick={() => choose(pendingTakeout, true)}
              className="h-9 self-start border border-border px-3 text-xs text-fg-muted hover:text-fg disabled:opacity-40"
            >
              {m.portability_resume_prepared_upload()}
            </button>
          )}
          <PortabilityImportSourcePicker
            key={formatName}
            busy={upload.isPending}
            extension={selectedFormat?.defaultExtension}
            label={
              upload.isPending ? m.portability_preparing_upload() : m.portability_choose_or_drop()
            }
            hint={
              m.portability_drop_original_prefix() +
              (selectedFormat ? ` .${selectedFormat.defaultExtension}` : "") +
              " " +
              m.portability_drop_original_suffix()
            }
            onFile={choose}
          />
        </>
      )}

      {job.data && <PortabilityJobStatus job={job.data} onCancel={() => job.cancel.mutate()} />}

      {preview && job.data?.state === "ready" && (
        <PortabilityImportPreview preview={preview} applying={apply.isPending} onReset={reset} />
      )}

      {job.data && ["completed", "failed", "cancelled"].includes(job.data.state) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {job.data.state === "completed" &&
            ((job.data.result?.subscriptions ?? 0) > 0 ||
              (job.data.result?.subscriptionGroups ?? 0) > 0) && (
              <Link
                to="/subscriptions/groups"
                className="inline-flex h-9 items-center border border-border px-3 text-xs text-fg hover:bg-surface-strong"
              >
                {m.sg_manage_groups()}
              </Link>
            )}
          <button
            type="button"
            onClick={reset}
            className="h-9 border border-border px-3 text-xs text-fg-muted hover:text-fg"
          >
            {m.portability_start_another_import()}
          </button>
          <button
            type="button"
            disabled={report.isPending}
            onClick={() => report.mutate()}
            className="h-9 border border-border px-3 text-xs text-fg-muted hover:text-fg disabled:opacity-40"
          >
            {m.portability_download_report()}
          </button>
        </div>
      )}
      {jobId && !job.data && job.error && (
        <button
          type="button"
          onClick={reset}
          className="h-9 border border-border px-3 text-xs text-fg-muted hover:text-fg"
        >
          {m.portability_choose_another_backup()}
        </button>
      )}
      {failure && (
        <p role="alert" className="text-sm text-danger">
          {failure instanceof Error ? failure.message : m.portability_import_failed()}
        </p>
      )}
      <Toast message={toast} />
    </div>
  );
}
