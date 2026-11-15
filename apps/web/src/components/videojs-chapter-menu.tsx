import { Menu, selectTime, useMedia, usePlayer } from "@videojs/react";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDuration } from "../lib/format";
import { BAR_MENU_ITEM, BAR_MENU_POPUP, BAR_PILL } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";

type Chapter = { start: number; end: number; title: string };

function useChapters(): Chapter[] {
  const target = (useMedia() as { target?: unknown } | null)?.target;
  const video = target instanceof HTMLVideoElement ? target : null;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  useEffect(() => {
    if (!video) return;
    const read = () => {
      const track = Array.from(video.textTracks).find((item) => item.kind === "chapters");
      if (!track) return;
      if (track.mode === "disabled") track.mode = "hidden";
      const cues = Array.from(track.cues ?? []) as VTTCue[];
      setChapters(cues.map((cue) => ({ start: cue.startTime, end: cue.endTime, title: cue.text })));
    };
    read();
    // The chapters <track> mounts after this hook and loads later still; its load event does not bubble, so the
    // video listens for it in the capture phase.
    video.addEventListener("load", read, true);
    video.textTracks.addEventListener("addtrack", read);
    return () => {
      video.removeEventListener("load", read, true);
      video.textTracks.removeEventListener("addtrack", read);
    };
  }, [video]);
  return chapters;
}

function CurrentChapter({ chapters }: { chapters: Chapter[] }) {
  const time = usePlayer(selectTime)?.currentTime ?? 0;
  const current =
    chapters.find((chapter) => time >= chapter.start && time < chapter.end) ?? chapters[0];
  return <span className="max-w-48 truncate">{current.title}</span>;
}

function ChapterRows({ chapters }: { chapters: Chapter[] }) {
  const time = usePlayer(selectTime);
  return (
    <>
      {chapters.map((chapter) => (
        <Menu.Item
          key={chapter.start}
          className={BAR_MENU_ITEM}
          onClick={() => time?.seek(chapter.start)}
        >
          <span className="truncate">{chapter.title}</span>
          <span className="shrink-0 text-white/60 tabular-nums">
            {formatDuration(chapter.start)}
          </span>
        </Menu.Item>
      ))}
    </>
  );
}

// The chapter the video is in, next to the time like the Vidstack and YouTube bars; it opens the chapter list.
export function VideoJsChapterMenu() {
  const chapters = useChapters();
  if (chapters.length < 2) return null;
  return (
    <Menu.Root side="top" align="start">
      <Menu.Trigger
        aria-label={m.player_chapters()}
        data-skin-chapter=""
        className={`${BAR_PILL} min-w-0 cursor-pointer gap-1 px-4 font-medium text-sm text-white outline-none transition-colors duration-150 hover:bg-black/50 focus-visible:ring-2 focus-visible:ring-white`}
        render={<button type="button" />}
      >
        <CurrentChapter chapters={chapters} />
        <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Popup className={`typetype-settings-menu ${BAR_MENU_POPUP}`}>
        <Menu.Content className="typetype-menu-content">
          <ChapterRows chapters={chapters} />
        </Menu.Content>
      </Menu.Popup>
    </Menu.Root>
  );
}
