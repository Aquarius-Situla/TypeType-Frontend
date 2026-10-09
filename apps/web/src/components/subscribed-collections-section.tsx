import { Link } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";

export type SubscribedCollectionDisplayItem = {
  id: string;
  title: string;
  streamCount: number;
  thumbnailUrl?: string;
  uploaderName?: string;
  to: string;
  search?: Record<string, unknown>;
  params?: Record<string, string>;
};

type Props = {
  collections: SubscribedCollectionDisplayItem[];
};

export function SubscribedCollectionsSection({ collections }: Props) {
  if (collections.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-fg">{m.ui_subscribed_collections()}</h2>
          <p className="text-xs text-fg-soft">{m.ui_subscribed_collections_desc()}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {collections.map((collection, index) => {
          const count =
            collection.streamCount === 1
              ? m.ui_video_count({ count: collection.streamCount })
              : m.ui_videos_count({ count: collection.streamCount });

          return (
            <div
              key={collection.id}
              className="group flex flex-col gap-2 animate-card-pop-in"
              style={{ animationDelay: `${Math.min(index * 45, 270)}ms` }}
            >
              {collection.params ? (
                <Link to="/playlists/$id" params={collection.params} className="block">
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-strong">
                    {collection.thumbnailUrl && (
                      <img
                        src={proxyImage(collection.thumbnailUrl)}
                        alt={collection.title}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="absolute top-1.5 left-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {m.ui_collection()}
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                      {count}
                    </div>
                  </div>
                </Link>
              ) : (
                <Link to="/playlist" search={collection.search as never} className="block">
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-strong">
                    {collection.thumbnailUrl && (
                      <img
                        src={proxyImage(collection.thumbnailUrl)}
                        alt={collection.title}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="absolute top-1.5 left-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {m.ui_collection()}
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                      {count}
                    </div>
                  </div>
                </Link>
              )}
              <div className="flex flex-col gap-0.5 px-1">
                {collection.params ? (
                  <Link to="/playlists/$id" params={collection.params} className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-fg group-hover:text-fg-strong">
                      {collection.title}
                    </p>
                  </Link>
                ) : (
                  <Link to="/playlist" search={collection.search as never} className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-fg group-hover:text-fg-strong">
                      {collection.title}
                    </p>
                  </Link>
                )}
                {collection.uploaderName && (
                  <p className="truncate text-xs text-fg-muted">{collection.uploaderName}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
