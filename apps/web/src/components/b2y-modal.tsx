import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fetchSearch } from "../lib/api-discovery";
import { normalizeBilibiliTarget, useB2YStore } from "../stores/b2y-store";
import type { VideoItem } from "../types/api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  streamId: string;
  streamTitle: string;
  onSuccessToast?: (msg: string) => void;
};

export function B2YModal({ isOpen, onClose, streamId, streamTitle, onSuccessToast }: Props) {
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
      // Service 6 corresponds to Bilibili
      const res = await fetchSearch(searchQuery.trim(), 6);
      setSearchResults(res.items.slice(0, 5));
      if (res.items.length === 0) {
        setSearchError("未在B站找到相关视频，建议尝试精简关键词或手动输入BV号");
      }
    } catch {
      setSearchError("搜索B站视频失败，请检查网络或手动粘贴BV号");
    } finally {
      setSearching(false);
    }
  }

  function handleLinkItem(item: VideoItem) {
    const targetUrl = item.url || item.id;
    setLink(streamId, targetUrl, item.title, offsetInput);
    onSuccessToast?.("已成功联动B站弹幕！按 D 键可随时开关弹幕");
    onClose();
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bvInput.trim()) return;
    const target = normalizeBilibiliTarget(bvInput);
    setLink(streamId, target, undefined, offsetInput);
    onSuccessToast?.("已成功联动B站弹幕！按 D 键可随时开关弹幕");
    onClose();
  }

  function handleNudgeOffset(delta: number) {
    const next = Math.round((offsetInput + delta) * 10) / 10;
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
        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto bg-surface border border-border-strong rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-fg [scrollbar-width:thin]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border-strong/60">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-500/15 text-pink-500 font-bold text-sm">
              B2Y
            </span>
            <div>
              <h2 id="b2y-modal-title" className="text-base font-semibold leading-tight">
                B2Y 弹幕联动
              </h2>
              <p className="text-xs text-fg-soft mt-0.5">
                将哔哩哔哩弹幕导入当前 YouTube 视频，享受无损画质与实时弹幕
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-fg-muted hover:text-fg text-sm px-2 py-1 rounded-md transition-colors"
          >
            ✕
          </button>
        </div>

        {b2yLink && (
          <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-pink-500/20 text-pink-400">
                  ● 已联动 B站弹幕
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
                  onSuccessToast?.("已解除B站弹幕联动");
                }}
                className="shrink-0 px-2.5 py-1 text-xs text-danger hover:bg-danger/10 border border-danger/30 rounded-lg transition-colors"
              >
                解除联动
              </button>
            </div>

            <div className="pt-2 border-t border-border-strong/40 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-fg-muted">弹幕时间轴微调 (校准片头时间差):</span>
                <span className="font-mono font-semibold text-pink-400">
                  {offsetInput > 0 ? `+${offsetInput.toFixed(1)}s` : `${offsetInput.toFixed(1)}s`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleNudgeOffset(-5)}
                  className="px-2 py-1 text-xs bg-surface-strong hover:bg-surface-strong/80 rounded border border-border-strong transition-colors"
                >
                  -5s
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeOffset(-1)}
                  className="px-2 py-1 text-xs bg-surface-strong hover:bg-surface-strong/80 rounded border border-border-strong transition-colors"
                >
                  -1s
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeOffset(-0.5)}
                  className="px-2 py-1 text-xs bg-surface-strong hover:bg-surface-strong/80 rounded border border-border-strong transition-colors"
                >
                  -0.5s
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOffsetInput(0);
                    setOffset(streamId, 0);
                  }}
                  className="px-2 py-1 text-xs bg-surface-strong hover:bg-surface-strong/80 rounded border border-border-strong transition-colors"
                >
                  0s
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeOffset(0.5)}
                  className="px-2 py-1 text-xs bg-surface-strong hover:bg-surface-strong/80 rounded border border-border-strong transition-colors"
                >
                  +0.5s
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeOffset(1)}
                  className="px-2 py-1 text-xs bg-surface-strong hover:bg-surface-strong/80 rounded border border-border-strong transition-colors"
                >
                  +1s
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeOffset(5)}
                  className="px-2 py-1 text-xs bg-surface-strong hover:bg-surface-strong/80 rounded border border-border-strong transition-colors"
                >
                  +5s
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              {b2yLink ? "重新匹配或更换关联视频" : "关联 B站视频"}
            </span>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入标题在B站搜索..."
                className="flex-1 px-3 py-2 text-sm bg-surface-strong border border-border-strong rounded-lg text-fg placeholder:text-fg-soft focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2 text-sm font-medium bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                {searching ? "搜索中..." : "在B站搜索"}
              </button>
            </div>

            {searchError && <p className="text-xs text-amber-400 mt-1">{searchError}</p>}

            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2 mt-2 max-h-48 overflow-y-auto pr-1">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-lg bg-surface-strong border border-border-strong hover:border-pink-500/40 transition-colors"
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
                        <p className="text-[11px] text-fg-soft truncate">UP: {item.uploaderName}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLinkItem(item)}
                      className="shrink-0 px-2.5 py-1 text-xs font-medium bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 rounded border border-pink-500/30 transition-colors"
                    >
                      立即联动
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-border-strong/60 w-full" />
            <span className="absolute bg-surface px-2 text-[11px] text-fg-soft uppercase">
              或者手动输入
            </span>
          </div>

          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="b2y-bv-input" className="text-xs text-fg-muted">
                B站视频 BV号 或 完整链接
              </label>
              <input
                id="b2y-bv-input"
                type="text"
                value={bvInput}
                onChange={(e) => setBvInput(e.target.value)}
                placeholder="例如 BV1xx411c7mD 或 https://www.bilibili.com/video/..."
                className="w-full px-3 py-2 text-sm bg-surface-strong border border-border-strong rounded-lg text-fg placeholder:text-fg-soft focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="text-[11px] text-fg-soft">
                💡 联动后在播放界面按电脑键盘{" "}
                <kbd className="px-1 py-0.5 bg-surface-strong rounded border border-border-strong text-fg">
                  D
                </kbd>{" "}
                键可随时开关弹幕
              </div>
              <button
                type="submit"
                disabled={!bvInput.trim()}
                className="px-4 py-2 text-sm font-medium bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors disabled:opacity-40 shrink-0"
              >
                保存联动
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body,
  );
}
