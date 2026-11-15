import { useTwitchClipPlayback } from "../hooks/use-twitch";
import { TwitchPlayer } from "./twitch-player";
import { TwitchWatchHeading } from "./twitch-watch-heading";
import { TwitchWatchStage } from "./twitch-watch-stage";

export function TwitchClipView({ slug }: { slug: string }) {
  const { data, isLoading, error } = useTwitchClipPlayback(slug);
  const source = data?.qualities[0]?.url;
  return (
    <TwitchWatchStage loading={isLoading} error={error}>
      {data && source && (
        <>
          <TwitchPlayer
            target={{ clip: slug }}
            src={source}
            live={false}
            mp4
            title={data.clip.title}
            poster={data.clip.thumbnailUrl}
          />
          <TwitchWatchHeading title={data.clip.title} user={data.clip.broadcaster} />
        </>
      )}
    </TwitchWatchStage>
  );
}
