import { m } from "../paraglide/messages.js";
import { FailMascot } from "./fail-mascot";

export function DownloaderStorageError() {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-danger/20 bg-app/60 p-2">
      <FailMascot className="w-20 shrink-0 motion-reduce:hidden" />
      <p className="text-xs leading-relaxed text-fg-muted">
        {m.ui_downloader_insufficient_storage_help()}
      </p>
    </div>
  );
}
