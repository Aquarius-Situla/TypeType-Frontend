import { useNavigate } from "@tanstack/react-router";
import { toCanonicalChannelRoute } from "../lib/channel-route-url";
import { toDirectWatchUrl } from "../lib/direct-watch-url";
import { useSearchHistory } from "./use-search-history";
import { useSettings } from "./use-settings";

type Params = {
  onClose: () => void;
};

export function useSearchOverlayNavigation({ onClose }: Params) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const service = settings.defaultService;
  const { add } = useSearchHistory();

  function navigateAndClose(term: string, selectedService = service) {
    const trimmed = term.trim();
    if (!trimmed) return;
    const directWatchUrl = toDirectWatchUrl(trimmed);
    if (directWatchUrl) {
      navigate({ to: "/watch", search: { v: directWatchUrl } });
      onClose();
      return;
    }
    const canonicalChannel = toCanonicalChannelRoute(trimmed);
    if (canonicalChannel) {
      navigate({
        to: "/channel/$provider/$channelId",
        params: { provider: canonicalChannel.provider, channelId: canonicalChannel.id },
        search: {},
      });
      onClose();
      return;
    }
    const uidMatch = trimmed.match(/^uid[:：\s]+(\d{1,20})$/i);
    if (uidMatch && selectedService === 5) {
      navigate({
        to: "/channel/$provider/$channelId",
        params: { provider: "bilibili", channelId: uidMatch[1] },
        search: {},
      });
      onClose();
      return;
    }
    add.mutate(trimmed);
    navigate({ to: "/search", search: { q: trimmed, service: selectedService } });
    onClose();
  }

  return { service, navigateAndClose };
}
