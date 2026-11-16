import { Slider, selectTime, TimeSlider, usePlayer } from "@videojs/react";
import {
  getSponsorBlockCategoryColor,
  getSponsorBlockEndTime,
  getSponsorBlockStartTime,
} from "../lib/sponsorblock-settings";
import type { SponsorBlockSegmentItem } from "../types/api";

function SponsorBlockLayer({ segments }: { segments: readonly SponsorBlockSegmentItem[] }) {
  const duration = usePlayer(selectTime)?.duration ?? 0;
  if (!Number.isFinite(duration) || duration <= 0) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2"
    >
      {segments.map((segment) => {
        const color = getSponsorBlockCategoryColor(segment.category);
        if (!color) return null;
        const start = getSponsorBlockStartTime(segment, duration);
        const end = getSponsorBlockEndTime(segment, duration);
        return (
          <span
            key={`${segment.category}-${start}`}
            className="absolute inset-y-0 opacity-90 group-data-[pointing]/slider:-inset-y-0.5"
            style={{
              left: `${(start / duration) * 100}%`,
              width: `${((end - start) / duration) * 100}%`,
              backgroundColor: color,
            }}
          />
        );
      })}
    </div>
  );
}

// Chapters split the track the way YouTube does; SponsorBlock segments sit on top in their category colours, and the
// preview shows the storyboard frame, the chapter title and the time under the pointer.
export function VideoJsWatchTimeline({
  segments,
}: {
  segments?: readonly SponsorBlockSegmentItem[];
}) {
  return (
    <TimeSlider.Root className="group/slider relative flex h-5 w-full cursor-pointer touch-none items-center outline-none">
      <TimeSlider.Chapters
        className="flex h-full w-full items-center"
        renderChapter={(props) => (
          <div
            {...props}
            className="flex h-full w-(--media-slider-chapter-width) shrink-0 items-center pr-0.5 last:pr-0"
          >
            <TimeSlider.Track className="relative h-1 w-full overflow-hidden rounded-full bg-white/25 transition-[height] motion-reduce:transition-none group-data-[pointing]/slider:h-1.5">
              <TimeSlider.Buffer className="absolute inset-y-0 left-0 w-(--media-slider-chapter-buffer) bg-white/40" />
              <TimeSlider.Fill className="absolute inset-y-0 left-0 w-(--media-slider-chapter-fill) bg-(--media-accent-color,#ef4444)" />
            </TimeSlider.Track>
          </div>
        )}
      />
      {segments && segments.length > 0 && <SponsorBlockLayer segments={segments} />}
      <TimeSlider.Thumb className="absolute left-(--media-slider-fill) size-3.5 -translate-x-1/2 rounded-full bg-(--media-accent-color,#ef4444) opacity-0 outline-none transition-opacity motion-reduce:transition-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70 group-data-[pointing]/slider:opacity-100 group-data-[dragging]/slider:opacity-100" />
      <TimeSlider.Preview className="pointer-events-none absolute bottom-full mb-3 flex flex-col items-center gap-1 opacity-0 group-data-[pointing]/slider:opacity-100">
        <Slider.Thumbnail.Root className="overflow-hidden rounded-md bg-black shadow-lg ring-1 ring-white/20 [&:not(:has(img[src]))]:hidden">
          <Slider.Thumbnail.Image className="block max-w-48" />
        </Slider.Thumbnail.Root>
        <div className="flex flex-col items-center rounded bg-black/85 px-2 py-0.5 text-white text-xs">
          <TimeSlider.ChapterTitle className="max-w-48 truncate font-medium empty:hidden" />
          <TimeSlider.Value type="pointer" className="tabular-nums" />
        </div>
      </TimeSlider.Preview>
    </TimeSlider.Root>
  );
}
