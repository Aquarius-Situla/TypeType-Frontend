import type { SubscribedCollectionSectionMeta } from "../lib/stream-collections";
import { toPublicWatchParam } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";

type Props = {
  sections: SubscribedCollectionSectionMeta[];
  activeSectionId: string | null;
  onSelectSection: (id: string | null) => void;
  totalCount: number;
  videoUrls?: string[];
};

export function PlaylistSectionTabs({
  sections,
  activeSectionId,
  onSelectSection,
  totalCount,
  videoUrls = [],
}: Props) {
  if (!sections || sections.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      <button
        type="button"
        onClick={() => onSelectSection(null)}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-xs transition-colors ${
          activeSectionId === null
            ? "bg-fg text-app"
            : "border border-border-strong text-fg-muted hover:bg-surface-strong hover:text-fg"
        }`}
      >
        <span>{m.ui_all()}</span>
        <span className={`text-[10px] ${activeSectionId === null ? "opacity-80" : "text-fg-soft"}`}>
          ({totalCount})
        </span>
      </button>
      {sections.map((section) => {
        const isSelected = activeSectionId === section.id;
        const count =
          videoUrls.length > 0
            ? videoUrls.filter((u) => {
                const param = toPublicWatchParam(u);
                return (
                  section.videoUrls.includes(u.trim()) ||
                  section.videoUrls.some((su) => toPublicWatchParam(su) === param)
                );
              }).length
            : section.videoUrls.length;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelectSection(section.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-xs transition-colors ${
              isSelected
                ? "bg-fg text-app"
                : "border border-border-strong text-fg-muted hover:bg-surface-strong hover:text-fg"
            }`}
          >
            <span>{section.title}</span>
            <span className={`text-[10px] ${isSelected ? "opacity-80" : "text-fg-soft"}`}>
              ({count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
