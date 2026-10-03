import { m } from "../paraglide/messages.js";
import type { PortabilityJob } from "./api-portability";
import { portabilityResponse } from "./api-portability-response";
import { authed } from "./authed";
import { API_BASE } from "./env";
import {
  clearPortabilityPreparationProgress,
  setPortabilityPreparationProgress,
} from "./portability-preparation-progress";
import { prepareYoutubeTakeout } from "./prepare-youtube-takeout";
import { isYoutubeTakeoutArchive } from "./youtube-takeout-archive";
import { clearPreparedTakeout } from "./youtube-takeout-prepared-store";

const MAX_UPLOAD_BYTES = 512 * 1024 * 1024;

export type PortabilityImportOptions = {
  ownerId?: string;
  preparedFile?: File;
  onPrepared?: (file: File) => void;
  onAccepted?: (job: PortabilityJob) => void;
};

export async function startPortabilityImport(
  file: File,
  format: string,
  options: PortabilityImportOptions = {},
): Promise<PortabilityJob> {
  const ownerId = options.ownerId;
  try {
    const autoFormat = format === "auto";
    const takeout =
      format === "youtube-takeout" || (autoFormat && (await isYoutubeTakeoutArchive(file)));
    if (takeout) {
      file =
        options.preparedFile ??
        (await prepareYoutubeTakeout(file, {
          ownerId,
          onProgress: (progress) => {
            if (ownerId) setPortabilityPreparationProgress({ ownerId, ...progress });
          },
        }));
      options.onPrepared?.(file);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(m.portability_upload_too_large_client());
    }
    if (ownerId) {
      setPortabilityPreparationProgress({
        ownerId,
        phase: "uploading",
        processed: 0,
        total: null,
      });
    }
    const body = new FormData();
    body.append("file", file);
    const query = autoFormat ? "" : `?format=${encodeURIComponent(format)}`;
    const job = await portabilityResponse<PortabilityJob>(
      await authed(`${API_BASE}/portability/imports${query}`, {
        method: "POST",
        body,
      }),
    );
    options.onAccepted?.(job);
    if (ownerId && takeout) await clearPreparedTakeout(ownerId);
    return job;
  } finally {
    if (ownerId) clearPortabilityPreparationProgress(ownerId);
  }
}
