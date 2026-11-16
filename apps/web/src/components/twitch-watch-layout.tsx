import type { ReactNode } from "react";
import { useWatchLayoutStore } from "../stores/watch-layout-store";

// The stage with the chat beside it; in cinema mode the stage takes the whole width and the chat moves under it.
export function TwitchWatchLayout({ children, chat }: { children: ReactNode; chat?: ReactNode }) {
  const cinema = useWatchLayoutStore((state) => state.cinemaMode);
  return (
    <div
      className={cinema ? "flex flex-col gap-4" : "flex flex-col gap-4 lg:flex-row lg:items-start"}
    >
      {children}
      {chat && (
        <aside
          className={
            cinema
              ? "h-[28rem] w-full"
              : "w-full lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)] lg:w-96"
          }
        >
          {chat}
        </aside>
      )}
    </div>
  );
}
