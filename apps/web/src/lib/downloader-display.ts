import { m } from "../paraglide/messages.js";
import type { DownloaderJobStage, DownloaderJobStatus } from "../types/downloader";

export function downloaderSteps(): string[] {
  return [m.ui_prepare(), m.ui_download(), m.ui_finalize()];
}

export function isCancelledDownloaderJob(
  status: DownloaderJobStatus | null,
  stage: DownloaderJobStage | null,
  errorCode: string | null,
): boolean {
  return (status === "failed" && errorCode === "cancelled") || stage === "cancelled";
}

export function isFailedDownloaderJob(
  status: DownloaderJobStatus | null,
  stage: DownloaderJobStage | null,
  errorCode: string | null,
): boolean {
  return (
    (status === "failed" || stage === "failed") &&
    !isCancelledDownloaderJob(status, stage, errorCode)
  );
}

export function downloaderStageIndex(
  status: DownloaderJobStatus | null,
  stage: DownloaderJobStage | null,
): number {
  if (status === "done" || stage === "done") return 3;
  if (stage === "download" || stage === "downloading") return 1;
  if (stage === "mux" || stage === "finalizing") return 2;
  if (status === "running" || stage === "extract" || stage === "running") return 0;
  return -1;
}

export function downloaderStatusLabel(
  status: DownloaderJobStatus | null,
  stage: DownloaderJobStage | null,
  errorCode: string | null,
  forceWaiting: boolean,
): string {
  if (forceWaiting) return m.ui_opening_file();
  if (isCancelledDownloaderJob(status, stage, errorCode)) return m.portability_job_cancelled();
  if (isFailedDownloaderJob(status, stage, errorCode)) return m.ui_failed();
  if (stage === "cached") return m.ui_ready_from_cache();
  if (status === "done" || stage === "done") return m.ui_ready();
  if (status === "queued" || stage === "queued") return m.ui_queued();
  if (stage === "download" || stage === "downloading") return m.ui_downloading();
  if (stage === "mux" || stage === "finalizing") return m.ui_finalizing();
  return m.ui_preparing_download();
}

export function downloaderStatusMessage(
  status: DownloaderJobStatus | null,
  stage: DownloaderJobStage | null,
  errorCode: string | null,
  errorText: string | null,
  forceWaiting: boolean,
): string {
  if (forceWaiting) return m.ui_handing_file_to_browser();
  if (isCancelledDownloaderJob(status, stage, errorCode)) return m.ui_download_cancelled();
  if (isFailedDownloaderJob(status, stage, errorCode)) {
    if (errorCode === "insufficient_storage") return m.ui_downloader_insufficient_storage();
    if (errorCode === "exact_selection_unavailable" && errorText) return errorText;
    return m.ui_download_could_not_be_completed();
  }
  if (stage === "cached") return m.ui_using_cached_file();
  if (status === "done" || stage === "done") return m.ui_file_is_ready();
  if (status === "queued" || stage === "queued") return m.ui_waiting_for_worker();
  if (stage === "download" || stage === "downloading") return m.ui_downloading_selected_media();
  if (stage === "mux" || stage === "finalizing") return m.ui_combining_final_file();
  return m.ui_preparing_streams_and_selecting_format();
}

export function downloaderProgressValue(
  status: DownloaderJobStatus | null,
  stage: DownloaderJobStage | null,
  progressPercent: number | null,
  forceWaiting: boolean,
): number {
  if (forceWaiting || status === "done" || stage === "done") return 100;
  if (typeof progressPercent === "number") return Math.min(100, Math.max(0, progressPercent));
  if (status === "running") return 12;
  if (status === "queued") return 4;
  return 0;
}

export function shouldShowDownloaderProgress(
  status: DownloaderJobStatus | null,
  forceWaiting: boolean,
): boolean {
  return forceWaiting || status === "queued" || status === "running" || status === "done";
}

export function downloaderFailureDetail(
  status: DownloaderJobStatus | null,
  stage: DownloaderJobStage | null,
  errorCode: string | null,
  errorText: string | null,
): string | null {
  if (!isFailedDownloaderJob(status, stage, errorCode)) return null;
  if (errorCode === "insufficient_storage" || errorCode === "exact_selection_unavailable")
    return null;
  const detail = errorText?.trim();
  return detail ? detail : null;
}
