import { proxyImage } from "../lib/proxy";
import { isCollectionPlaylist } from "../lib/stream-collections";
import { m } from "../paraglide/messages.js";
import type { PublicPlaylistInfo } from "../types/playlist";

type Props = {
  info: PublicPlaylistInfo;
};

export function PublicPlaylistHeader({ info }: Props) {
  const isCollection = isCollectionPlaylist(info);
  const count = info.streamCount;
  const countLabel = count === 1 ? m.ui_video_count({ count }) : m.ui_videos_count({ count });
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {info.thumbnailUrl && (
        <img
          src={proxyImage(info.thumbnailUrl)}
          alt=""
          loading="lazy"
          className="w-40 aspect-video rounded-xl object-cover bg-surface-strong flex-shrink-0"
        />
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-fg truncate">{info.title}</h1>
          {isCollection && (
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {m.ui_collection()}
            </span>
          )}
        </div>
        {info.uploaderName && <p className="text-sm text-fg-muted truncate">{info.uploaderName}</p>}
        <p className="text-xs text-fg-soft">{countLabel}</p>
      </div>
    </div>
  );
}
