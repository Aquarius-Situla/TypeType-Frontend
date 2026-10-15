import { Link } from "@tanstack/react-router";
import { siBilibili, siNiconico, siYoutube } from "simple-icons";
import { useClientLocale } from "../hooks/use-client-locale";
import { useDeArrowBranding } from "../hooks/use-dearrow";
import { formatPublishedDate } from "../lib/format";
import { proxyImage } from "../lib/proxy";
import { watchRouteSearch } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import type { NotificationItem } from "../types/notifications";
import { ServiceIcon } from "./service-icon";
import { VideoMembershipBadge } from "./video-membership-badge";

type Props = {
  item: NotificationItem;
  onOpen: () => void;
};

export function NotificationRow({ item, onOpen }: Props) {
  const locale = useClientLocale();
  const videoId = item.video.url.trim().length > 0 ? item.video.url : item.video.id;
  const publishedAt =
    typeof item.publishedAt === "number" && item.publishedAt > 0
      ? item.publishedAt
      : item.video.publishedAt;
  const createdText =
    formatPublishedDate(publishedAt ?? undefined, undefined, locale) || m.ui_recent();
  const branding = useDeArrowBranding(
    videoId,
    item.video.title,
    proxyImage(item.video.thumbnailUrl),
  );
  const service = serviceBrand(item.serviceId, item.serviceName);

  return (
    <Link
      to="/watch"
      search={watchRouteSearch(videoId)}
      className="grid grid-cols-[96px_1fr] gap-3 rounded-lg px-2 py-2 hover:bg-surface-strong [animation:card-pop-in_0.24s_ease-out]"
      onClick={onOpen}
    >
      <img
        src={branding.thumbnail}
        alt={branding.title}
        className="h-[54px] w-24 rounded object-cover"
        loading="lazy"
      />
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-medium leading-tight text-fg">{branding.title}</p>
        {item.video.requiresMembership && <VideoMembershipBadge compact />}
        <div className="mt-1 flex min-w-0 items-center gap-1.5">
          <img
            src={proxyImage(item.channelAvatarUrl)}
            alt={item.channelName}
            className="h-4 w-4 rounded-full"
            loading="lazy"
          />
          <span className="truncate text-xs text-fg-muted">{item.channelName}</span>
          <span
            className="inline-flex shrink-0 items-center gap-1 text-[10px] text-fg-soft"
            title={service.label}
          >
            <ServiceIcon path={service.path} color={service.color} label={service.label} />
            <span className="hidden sm:inline">{service.label}</span>
          </span>
          <span className="text-xs text-fg-soft">{createdText}</span>
        </div>
      </div>
    </Link>
  );
}

function serviceBrand(serviceId: number, serviceName: string) {
  switch (serviceId) {
    case 5:
      return { label: serviceName || "BiliBili", path: siBilibili.path, color: "#00a1d6" };
    case 6:
      return { label: serviceName || "NicoNico", path: siNiconico.path, color: "#aaaaaa" };
    case 0:
      return { label: serviceName || "YouTube", path: siYoutube.path, color: "#ff0000" };
    default:
      return { label: serviceName || "Video service", path: siYoutube.path, color: "#777777" };
  }
}
