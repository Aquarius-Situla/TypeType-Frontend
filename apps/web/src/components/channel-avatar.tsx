import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "./skeleton";

type Props = {
  src: string;
  name: string;
  className?: string;
  pending?: boolean;
  priority?: boolean;
};

function getInitial(name: string): string {
  if (!name) return "?";
  if (name.startsWith("http")) {
    try {
      const segments = new URL(name).pathname.split("/").filter(Boolean);
      const last = segments.pop() ?? "";
      return (last.replace("@", "")[0] ?? "?").toUpperCase();
    } catch {
      return "?";
    }
  }
  return name[0].toUpperCase();
}

export function ChannelAvatar({ src, name, className = "w-8 h-8", pending, priority }: Props) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [missingExpired, setMissingExpired] = useState(false);
  const [retryState, setRetryState] = useState({ src, count: 0, pending: false });
  const hasSource = src.trim().length > 0;
  const loaded = loadedSrc === src;
  const retryCount = retryState.src === src ? retryState.count : 0;
  useEffect(() => {
    if (hasSource || pending === false) {
      setMissingExpired(false);
      return;
    }
    if (pending === true) return;
    setMissingExpired(false);
    const timer = window.setTimeout(() => setMissingExpired(true), MISSING_AVATAR_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [hasSource, pending]);
  useEffect(() => {
    if (!hasSource || loaded || retryState.src !== src || !retryState.pending) return;
    const timer = window.setTimeout(() => {
      setRetryState((current) =>
        current.src === src && current.pending
          ? { ...current, count: current.count + 1, pending: false }
          : current,
      );
    }, avatarRetryDelayMs(retryState.count));
    return () => window.clearTimeout(timer);
  }, [hasSource, loaded, retryState, src]);
  const missing = !hasSource && (pending === true || (pending === undefined && !missingExpired));
  const loading = missing || (hasSource && !loaded);
  const state = loading ? "loading" : hasSource ? "ready" : "fallback";

  return (
    <div
      className={`${className} relative flex flex-shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-border bg-gradient-to-br from-surface-strong to-surface-soft font-semibold text-fg-muted`}
      title={name}
      data-avatar-state={state}
      aria-busy={loading}
    >
      {!loading &&
        (name.trim() ? (
          <span className="text-base leading-none">{getInitial(name)}</span>
        ) : (
          <UserRound className="h-1/2 w-1/2" aria-hidden="true" />
        ))}
      {hasSource && (
        <img
          key={`${src}:${retryCount}`}
          src={avatarRetrySrc(src, retryCount)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 z-0 h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoadedSrc(src)}
          onError={() => {
            setLoadedSrc((current) => (current === src ? null : current));
            setRetryState((current) => {
              const currentRetry =
                current.src === src ? current : { src, count: 0, pending: false };
              return currentRetry.pending ? currentRetry : { ...currentRetry, pending: true };
            });
          }}
        />
      )}
      {loading && <Skeleton className="absolute inset-0 z-10 rounded-full" data-avatar-skeleton />}
    </div>
  );
}

function avatarRetrySrc(src: string, retryCount: number): string {
  if (retryCount === 0) return src;
  const url = new URL(src, window.location.href);
  url.searchParams.set("_tt_avatar_retry", String(retryCount));
  return url.toString();
}

export function avatarRetryDelayMs(retryCount: number): number {
  const exponent = Math.min(Math.max(Math.floor(retryCount), 0), 9);
  return Math.min(1_000 * 2 ** exponent, 5 * 60 * 1_000);
}

const MISSING_AVATAR_GRACE_MS = 1_500;
