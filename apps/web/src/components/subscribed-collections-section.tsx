import { Layers } from "lucide-react";
import { m } from "../paraglide/messages.js";
import type { SavedPlaylistItem } from "../types/playlist";
import { SavedPlaylistCard } from "./saved-playlist-card";

type Props = {
  collections: SavedPlaylistItem[];
  onDelete: (playlist: SavedPlaylistItem) => void;
};

export function SubscribedCollectionsSection({ collections, onDelete }: Props) {
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
        {collections.map((collection, index) => (
          <div
            key={collection.id}
            className="animate-card-pop-in"
            style={{ animationDelay: `${Math.min(index * 45, 270)}ms` }}
          >
            <SavedPlaylistCard playlist={collection} onDelete={() => onDelete(collection)} />
          </div>
        ))}
      </div>
    </section>
  );
}
