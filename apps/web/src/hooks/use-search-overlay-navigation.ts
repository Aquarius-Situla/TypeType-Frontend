import { useNavigate } from "@tanstack/react-router";
import { toCanonicalChannelRoute } from "../lib/channel-route-url";
import { toDirectWatchUrl } from "../lib/direct-watch-url";
import { twitchUrlTarget } from "../lib/twitch-url";
import { useUiStore } from "../stores/ui-store";
import { useSearchHistory } from "./use-search-history";
import { useSettings } from "./use-settings";
import { useTwitchEnabled } from "./use-twitch";

type Params = {
  onClose: () => void;
};

export function useSearchOverlayNavigation({ onClose }: Params) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const service = settings.defaultService;
  const { add } = useSearchHistory();
  const twitchEnabled = useTwitchEnabled();
  const twitchSelected = useUiStore((state) => state.searchTwitch);
  const searchTwitch = twitchSelected && twitchEnabled;

  function navigateAndClose(term: string, selectedService = service) {
    const trimmed = term.trim();
    if (!trimmed) return;
    const twitchTarget = twitchUrlTarget(trimmed);
    if (twitchTarget) {
      navigate({ to: "/twitch/watch", search: twitchTarget });
      onClose();
      return;
    }
    if (searchTwitch) {
      add.mutate(trimmed);
      navigate({ to: "/twitch/search", search: { q: trimmed } });
      onClose();
      return;
    }
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
