import { CirclePlay } from "lucide-react";
import { useVideoTitle } from "../hooks/use-video-title";
import type { VideoIdMention } from "../lib/video-id-mentions";

// The raw id stays on screen until its title is known, and stays if no title comes back.
function MentionLabel({ mention }: { mention: VideoIdMention }) {
  const title = useVideoTitle(mention.id);
  if (!title) return <>{mention.raw}</>;
  return (
    <>
      <CirclePlay className="mr-0.5 inline-block size-[1em] align-[-0.15em]" aria-hidden="true" />
      {title}
    </>
  );
}

export function VideoIdLink({
  mention,
  onOpen,
}: {
  mention: VideoIdMention;
  onOpen: (url: string) => void;
}) {
  return (
    <a
      href={mention.path}
      title={mention.raw}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        onOpen(mention.url);
      }}
      className="text-accent hover:text-accent-strong underline underline-offset-2 transition-colors"
    >
      <MentionLabel mention={mention} />
    </a>
  );
}

export function VideoIdTitle({ mention }: { mention: VideoIdMention }) {
  return <MentionLabel mention={mention} />;
}
