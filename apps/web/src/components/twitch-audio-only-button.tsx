import { m } from "../paraglide/messages.js";
import { useTwitchAudioOnlyStore } from "../stores/twitch-audio-only-store";
import { WatchActionButton } from "./watch-action-button";
import { HeadphonesIcon } from "./watch-icons";

export function TwitchAudioOnlyButton() {
  const audioOnly = useTwitchAudioOnlyStore((state) => state.audioOnly);
  const toggle = useTwitchAudioOnlyStore((state) => state.toggle);
  return (
    <WatchActionButton onClick={toggle} pressed={audioOnly} active={audioOnly}>
      <HeadphonesIcon />
      <span>{m.watch_audio_only()}</span>
    </WatchActionButton>
  );
}
