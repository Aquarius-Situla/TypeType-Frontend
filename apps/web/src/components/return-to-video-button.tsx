import { useNavigate } from "@tanstack/react-router";
import { ArrowUpLeft } from "lucide-react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { usePersistentWatchPlayerStore } from "../hooks/use-persistent-watch-player";
import { m } from "../paraglide/messages.js";

export function ReturnToVideoButton() {
  const navigate = useNavigate();
  const entry = usePersistentWatchPlayerStore((state) => state.entry);
  const { locale } = useInterfaceLocale();
  const label = m.player_return_to_video({}, { locale });
  if (!entry) return null;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        if (entry.attached && entry.anchor) {
          window.scrollTo({ top: 0, behavior: "instant" });
        } else {
          void navigate({ href: entry.href, resetScroll: true });
        }
      }}
    >
      <ArrowUpLeft size={20} aria-hidden="true" />
    </button>
  );
}
