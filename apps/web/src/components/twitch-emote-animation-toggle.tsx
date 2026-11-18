import { Sparkles } from "lucide-react";
import { m } from "../paraglide/messages.js";
import { useEmoteAnimationStore } from "../stores/twitch-emote-animation-store";

export function TwitchEmoteAnimationToggle() {
  const animated = useEmoteAnimationStore((state) => state.animated);
  const toggle = useEmoteAnimationStore((state) => state.toggle);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={animated}
      aria-label={m.twitch_animated_emotes()}
      title={m.twitch_animated_emotes()}
      className={`ml-auto cursor-pointer rounded p-1 font-normal transition-colors hover:bg-surface-strong ${animated ? "text-[#a970ff]" : "text-fg-muted"}`}
    >
      <Sparkles className="size-4" aria-hidden="true" />
    </button>
  );
}
