import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";

export function LiveChatAvatar({
  url,
  name,
  color,
  compact,
}: {
  url?: string;
  name?: string;
  color: string;
  compact: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!failed || attempt >= 2) return;
    const timer = window.setTimeout(
      () => {
        setFailed(false);
        setAttempt((value) => value + 1);
      },
      1000 * 3 ** attempt,
    );
    return () => window.clearTimeout(timer);
  }, [failed, attempt]);
  const loading = Boolean(url && !loaded && (!failed || attempt < 2));
  return (
    <div
      aria-hidden="true"
      className={`relative mt-0.5 shrink-0 overflow-hidden rounded-full ${compact ? "size-5" : "size-[25px]"}`}
      style={{ color, backgroundColor: `${color}22` }}
    >
      <span className="flex size-full items-center justify-center text-[11px] font-semibold">
        {name ? Array.from(name)[0] : <UserRound size={12} />}
      </span>
      {loading && (
        <span className="absolute inset-0 animate-pulse bg-zinc-600 motion-reduce:animate-none" />
      )}
      {url && !failed && (
        <img
          key={attempt}
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 size-full object-cover ${loaded ? "" : "opacity-0"}`}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
