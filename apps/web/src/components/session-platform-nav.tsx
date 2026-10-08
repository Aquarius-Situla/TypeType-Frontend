import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { fetchBiliBiliSessionStatus } from "../lib/api-bilibili-session";
import { fetchYoutubeSessionStatus } from "../lib/api-youtube-session";
import { m } from "../paraglide/messages.js";
import { BiliBiliIcon } from "./bilibili-icon";
import { YoutubeIcon } from "./youtube-icon";

type Platform = "youtube" | "bilibili";

type Props = {
  active: Platform;
};

export function SessionPlatformNav({ active }: Props) {
  const qc = useQueryClient();
  const { authReady, isAuthed } = useAuth();

  useEffect(() => {
    if (!authReady || !isAuthed) return;
    void qc.prefetchQuery({
      queryKey: ["youtube-session"],
      queryFn: fetchYoutubeSessionStatus,
      staleTime: 60_000,
    });
    void qc.prefetchQuery({
      queryKey: ["bilibili-session"],
      queryFn: fetchBiliBiliSessionStatus,
      staleTime: 60_000,
    });
  }, [authReady, isAuthed, qc]);

  const items = [
    {
      id: "youtube" as const,
      to: "/youtube-session" as const,
      search: { returnTo: undefined },
      label: "YouTube",
      icon: <YoutubeIcon className="size-3.5 text-[#ff0000]" />,
    },
    {
      id: "bilibili" as const,
      to: "/bilibili-session" as const,
      search: { redirect: undefined },
      label: "BiliBili",
      icon: <BiliBiliIcon className="size-3.5 text-[#00a1d6]" />,
    },
  ];

  return (
    <nav
      className="flex items-center gap-1 rounded-lg border border-border bg-surface-soft/60 p-1"
      aria-label={m.nav_services()}
    >
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <Link
            key={item.id}
            to={item.to}
            search={item.search}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "border border-border bg-surface text-fg shadow-sm"
                : "border border-transparent text-fg-muted hover:bg-surface/50 hover:text-fg"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
