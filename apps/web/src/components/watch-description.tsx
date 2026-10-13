import { useState } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { formatExactDate } from "../lib/format";
import { m } from "../paraglide/messages.js";
import { RichText } from "./rich-text";

type Props = {
  description: string;
  videoUrl: string;
  uploadedAt?: number;
  onSeekTimestamp?: (seconds: number) => void;
};

export function WatchDescription({ description, videoUrl, uploadedAt, onSeekTimestamp }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { locale } = useInterfaceLocale();
  const exactDate = formatExactDate(uploadedAt, locale);

  if (!expanded) {
    return (
      <div className="w-full rounded-xl bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-strong">
        <p className="text-sm text-fg leading-relaxed line-clamp-3 whitespace-pre-wrap">
          <RichText text={description} videoUrl={videoUrl} onSeekTimestamp={onSeekTimestamp} />
        </p>
        <button
          type="button"
          className="mt-2 block text-xs font-medium text-fg-muted hover:text-fg transition-colors"
          onClick={() => setExpanded(true)}
        >
          {m.watch_show_more({}, { locale })}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl px-4 py-3">
      {exactDate && <p className="mb-2 text-xs font-medium text-fg-muted">{exactDate}</p>}
      <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">
        <RichText text={description} videoUrl={videoUrl} onSeekTimestamp={onSeekTimestamp} />
      </p>
      <button
        type="button"
        className="mt-3 text-xs font-medium text-fg-muted hover:text-fg transition-colors"
        onClick={() => setExpanded(false)}
      >
        {m.watch_show_less({}, { locale })}
      </button>
    </div>
  );
}
