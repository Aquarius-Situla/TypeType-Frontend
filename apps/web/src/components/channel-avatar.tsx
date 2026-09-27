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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [missingExpired, setMissingExpired] = useState(false);
  const [retryState, setRetryState] = useState({ src, count: 0 });
  const hasSource = src.trim().length > 0;
  const failed = failedSrc === src;
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
  const missing =
    !hasSource && !failed && (pending === true || (pending === undefined && !missingExpired));
  const loading = missing || (hasSource && !failed && !loaded);
  const state = loading ? "loading" : hasSource && !failed ? "ready" : "fallback";

  return (
    <div
      className={`${className} relative flex flex-shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-border bg-gradient-to-br from-surface-strong to-surface-soft font-semibold text-fg-muted`}
      title={name}
      data-avatar-state={state}
      aria-busy={loading}
    >
      {loading && <Skeleton className="absolute inset-0 rounded-full" data-avatar-skeleton />}
      {!loading &&
        (name.trim() ? (
          <span className="text-base leading-none">{getInitial(name)}</span>
        ) : (
          <UserRound className="h-1/2 w-1/2" aria-hidden="true" />
        ))}
      {hasSource && !failed && (
        <img
          key={retryCount}
          src={avatarRetrySrc(src, retryCount)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoadedSrc(src)}
          onError={() => {
            if (retryCount < MAX_AVATAR_RETRIES) {
              setRetryState({ src, count: retryCount + 1 });
              return;
            }
            setFailedSrc(src);
          }}
        />
      )}
    </div>
  );
}

function avatarRetrySrc(src: string, retryCount: number): string {
  if (retryCount === 0) return src;
  const url = new URL(src, window.location.href);
  url.searchParams.set("_tt_avatar_retry", String(retryCount));
  return url.toString();
}

const MAX_AVATAR_RETRIES = 2;
const MISSING_AVATAR_GRACE_MS = 1_500;
