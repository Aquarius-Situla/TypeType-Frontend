import { TriangleAlert } from "lucide-react";
import { m } from "../paraglide/messages.js";

const SOURCE_URL = "https://github.com/WesselKroos/youtube-ambilight";

export function AmbientLightNotes({ enabled }: { enabled: boolean }) {
  return (
    <div className="flex flex-col gap-2 pb-2">
      {enabled && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{m.ui_ambient_light_unstable_warning()}</span>
        </p>
      )}
      <a
        href={SOURCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-fg-soft underline-offset-2 hover:text-fg hover:underline"
      >
        {m.ui_ambient_light_credit()}
      </a>
    </div>
  );
}
