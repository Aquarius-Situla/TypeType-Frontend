import { Link2, Search, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { fetchSearch } from "../lib/api-discovery";
import { m } from "../paraglide/messages.js";
import { normalizeBilibiliTarget, useB2YStore } from "../stores/b2y-store";
import type { VideoItem } from "../types/api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  streamId: string;
  streamTitle: string;
  onSuccessToast?: (msg: string) => void;
};

function formatDiffLabel(diff: number): string {
  return diff > 0 ? `+${diff}s` : `${diff}s`;
}

export function B2YModal({ isOpen, onClose, streamId, streamTitle, onSuccessToast }: Props) {
  const { locale } = useInterfaceLocale();
  const b2yLink = useB2YStore((s) => s.links[streamId]);
  const setLink = useB2YStore((s) => s.setLink);
  const setOffset = useB2YStore((s) => s.setOffset);
  const removeLink = useB2YStore((s) => s.removeLink);

  const [bvInput, setBvInput] = useState("");
  const [offsetInput, setOffsetInput] = useState(0);
  const [searchQuery, setSearchQuery] = useState(streamTitle);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VideoItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (b2yLink) {
      setOffsetInput(b2yLink.offsetSeconds);
      setBvInput(b2yLink.bilibiliUrlOrBv);
    } else {
      setOffsetInput(0);
      setBvInput("");
    }
    setSearchQuery(streamTitle);
    setSearchResults([]);
    setSearchError(null);
  }, [b2yLink, streamTitle]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetchSearch(searchQuery.trim(), 5);
      setSearchResults(res.items);
    } catch {
      setSearchError(m.portability_resume_prepared_upload({}, { locale }));
    } finally {
      setSearching(false);
    }
  }

  function handleLinkItem(item: VideoItem) {
    const rawId = item.id.replace(/^\/?(watch\?v=|video\/)?/, "");
    const bv = rawId.match(/BV[a-zA-Z0-9]+/i)?.[0] ?? rawId;
    setLink(streamId, bv, item.title, offsetInput);
    onSuccessToast?.(m.b2y_modal_toast_linked({}, { locale }));
    onClose();
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = bvInput.trim();
    if (!trimmed) return;
    const targetUrl = normalizeBilibiliTarget(trimmed);
    const bvMatch = targetUrl.match(/BV[a-zA-Z0-9]+/i);
    const bv = bvMatch ? bvMatch[0] : trimmed;

    setLink(streamId, bv, "", offsetInput);
    onSuccessToast?.(m.b2y_modal_toast_linked({}, { locale }));
    onClose();
  }

  function handleNudgeOffset(diff: number) {
    const next = Math.round((offsetInput + diff) * 10) / 10;
    setOffsetInput(next);
    if (b2yLink) {
      setOffset(streamId, next);
    }
  }

  return createPortal(
    <>
      <div
        role="none"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="b2y-modal-title"
        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-fg [scrollbar-width:thin]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-strong border border-border text-fg">
              <Link2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 id="b2y-modal-title" className="text-base font-semibold leading-tight">
                {m.b2y_modal_title({}, { locale })}
              </h2>
              <p className="text-xs text-fg-soft mt-0.5">{m.b2y_modal_subtitle({}, { locale })}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={m.ui_close({}, { locale })}
            className="text-fg-muted hover:text-fg text-sm p-1.5 rounded-lg transition-colors hover:bg-surface-strong"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {b2yLink && (
          <div className="rounded-xl border border-border bg-surface-strong/50 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-surface-strong text-fg border border-border">
                  ● {m.b2y_modal_current_link({}, { locale })}
                </span>
                <p className="text-sm font-medium text-fg truncate mt-1">
                  {b2yLink.bilibiliTitle || b2yLink.bilibiliUrlOrBv}
                </p>
                <p className="text-xs text-fg-soft font-mono">{b2yLink.bilibiliUrlOrBv}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  removeLink(streamId);
                  onSuccessToast?.(m.b2y_modal_toast_unlinked({}, { locale }));
                }}
                className="shrink-0 px-2.5 py-1 text-xs text-danger hover:bg-danger/10 border border-danger/30 rounded-lg transition-colors"
              >
                {m.b2y_modal_unlink({}, { locale })}
              </button>
            </div>

            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-fg-muted">
                  {m.b2y_modal_time_offset(
                    {
                      offset:
                        offsetInput > 0 ? `+${offsetInput.toFixed(1)}` : offsetInput.toFixed(1),
                    },
                    { locale },
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[-5, -1, -0.5, 0, 0.5, 1, 5].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => {
                      if (diff === 0) {
                        setOffsetInput(0);
                        setOffset(streamId, 0);
                      } else {
                        handleNudgeOffset(diff);
                      }
                    }}
                    className="px-2 py-1 text-xs bg-surface-strong hover:bg-surface rounded border border-border transition-colors text-fg"
                  >
                    {formatDiffLabel(diff)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={m.b2y_modal_search_placeholder({}, { locale })}
                className="flex-1 px-3 py-2 text-sm bg-surface-strong border border-border rounded-lg text-fg placeholder:text-fg-soft focus:outline-none focus:border-fg-muted"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2 text-sm font-medium bg-fg text-app hover:opacity-90 rounded-lg transition-opacity disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5"
              >
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {searching
                    ? m.b2y_modal_searching({}, { locale })
                    : m.b2y_modal_search_button({}, { locale })}
                </span>
              </button>
            </div>

            {searchError && <p className="text-xs text-danger mt-1">{searchError}</p>}

            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2 mt-2 max-h-48 overflow-y-auto pr-1">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-lg bg-surface-strong border border-border hover:border-fg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.thumbnailUrl && (
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          className="w-14 h-9 object-cover rounded shrink-0 bg-surface"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-fg truncate">{item.title}</p>
                        <p className="text-[11px] text-fg-soft truncate">{item.uploaderName}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLinkItem(item)}
                      className="shrink-0 px-2.5 py-1 text-xs font-medium bg-fg text-app hover:opacity-90 rounded transition-opacity"
                    >
                      {m.b2y_modal_link_action({}, { locale })}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="b2y-bv-input" className="text-xs text-fg-muted">
                {m.b2y_modal_manual_input_title({}, { locale })}
              </label>
              <input
                id="b2y-bv-input"
                type="text"
                value={bvInput}
                onChange={(e) => setBvInput(e.target.value)}
                placeholder={m.b2y_modal_manual_input_placeholder({}, { locale })}
                className="w-full px-3 py-2 text-sm bg-surface-strong border border-border rounded-lg text-fg placeholder:text-fg-soft focus:outline-none focus:border-fg-muted"
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-1">
              <button
                type="submit"
                disabled={!bvInput.trim()}
                className="px-4 py-2 text-sm font-medium bg-fg text-app hover:opacity-90 rounded-lg transition-opacity disabled:opacity-40 shrink-0"
              >
                {m.b2y_modal_confirm({}, { locale })}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body,
  );
}
