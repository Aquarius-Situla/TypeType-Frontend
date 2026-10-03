import { m } from "../paraglide/messages.js";
import { ApiError } from "./api";
import { portabilityResponse } from "./api-portability-response";
import { authed } from "./authed";
import { API_BASE } from "./env";

export { startPortabilityImport } from "./api-portability-import";

type PortabilityDirection = "import" | "export";
export type PortabilityFidelity = "complete" | "partial";
type PortabilityJobState =
  | "queued"
  | "analyzing"
  | "ready"
  | "applying"
  | "encoding"
  | "completed"
  | "failed"
  | "cancelled";
export type PortabilityImportStage =
  | "subscriptions"
  | "recentHistory"
  | "playlists"
  | "history"
  | "remaining";

export type PortabilityCategory =
  | "subscriptions"
  | "subscriptionGroups"
  | "history"
  | "playlists"
  | "watchLater"
  | "favorites"
  | "progress"
  | "searchHistory"
  | "savedPlaylists"
  | "settings"
  | "contentFilters";

export type PortabilityFormatDescriptor = {
  format: string;
  adapterVersion: number;
  capabilities: {
    category: PortabilityCategory;
    directions: PortabilityDirection[];
    fidelity: PortabilityFidelity;
  }[];
  defaultExtension: string;
  contentType: string;
};

type PortabilityIssue = {
  category: PortabilityCategory | null;
  code: string;
  message: string;
  count: number;
};

export type PortabilityPreview = {
  detection: {
    format: string;
    formatVersion: string | null;
    adapterVersion: number;
    confidence: number;
    evidence: string;
  };
  counts: Partial<Record<PortabilityCategory, number>>;
  duplicates: number;
  issues: PortabilityIssue[];
};

export type PortabilityJob = {
  id: string;
  kind: PortabilityDirection;
  state: PortabilityJobState;
  createdAt: number;
  updatedAt: number;
  requestId: string | null;
  preview: PortabilityPreview | null;
  result: Partial<Record<PortabilityCategory, number>> | null;
  progress: {
    phase: "analyzing" | "collecting" | "applying" | "encoding";
    unit: "records" | "categories" | "bytes";
    processed: number;
    total: number | null;
    category?: PortabilityCategory | null;
    stage?: PortabilityImportStage | null;
    stageProcessed?: number;
    stageTotal?: number | null;
    checkpoint?: number;
  } | null;
  errorCode: string | null;
  errorMessage: string | null;
};

type PortabilityJobReport = Pick<
  PortabilityJob,
  "id" | "state" | "requestId" | "preview" | "result" | "errorCode" | "errorMessage"
>;

export async function getPortabilityFormats(): Promise<PortabilityFormatDescriptor[]> {
  return portabilityResponse(await authed(`${API_BASE}/portability/formats`));
}

export async function applyPortabilityImport(
  id: string,
  categories: PortabilityCategory[],
  duplicatePolicy: "skip" | "replace",
): Promise<PortabilityJob> {
  return portabilityResponse(
    await authed(`${API_BASE}/portability/jobs/${id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories, duplicatePolicy }),
    }),
  );
}

export async function startPortabilityExport(
  format: string,
  categories: PortabilityCategory[],
): Promise<PortabilityJob> {
  return portabilityResponse(
    await authed(`${API_BASE}/portability/exports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, categories }),
    }),
  );
}

export async function getPortabilityJob(id: string): Promise<PortabilityJob> {
  return portabilityResponse(await authed(`${API_BASE}/portability/jobs/${id}`));
}

export async function cancelPortabilityJob(id: string): Promise<PortabilityJob> {
  return portabilityResponse(
    await authed(`${API_BASE}/portability/jobs/${id}/cancel`, { method: "POST" }),
  );
}

export async function deletePortabilityJob(id: string): Promise<void> {
  const response = await authed(`${API_BASE}/portability/jobs/${id}`, { method: "DELETE" });
  if (!response.ok) throw new ApiError(response.statusText, response.status);
}

function artifactName(response: Response): string {
  const disposition = response.headers.get("Content-Disposition") ?? "";
  return disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? "typetype-export";
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<FileSystemFileHandle>;
};

export async function downloadPortabilityArtifact(
  id: string,
  suggestedName: string,
): Promise<void> {
  const picker = (window as SavePickerWindow).showSaveFilePicker;
  const handle = picker
    ? await picker({
        suggestedName,
        types: [
          {
            description: m.ui_backup_archive(),
            accept: { "application/octet-stream": [".zip", ".json", ".db", ".opml"] },
          },
        ],
      })
    : null;
  const response = await authed(`${API_BASE}/portability/jobs/${id}/artifact`);
  if (!response.ok) await portabilityResponse(response);
  if (handle && response.body) {
    const writable = await handle.createWritable();
    await response.body.pipeTo(writable);
    return;
  }
  downloadBlob(await response.blob(), artifactName(response));
}

export async function downloadPortabilityReport(id: string): Promise<void> {
  const response = await authed(`${API_BASE}/portability/jobs/${id}/report`);
  const report = await portabilityResponse<PortabilityJobReport>(response);
  downloadBlob(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    `typetype-portability-${id}.json`,
  );
}
