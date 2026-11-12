import { m } from "../paraglide/messages.js";
import { ReactionGif } from "./reaction-gif";

type EmbedGuestRequiredProps = {
  watchUrl: string;
};

export function EmbedGuestRequired({ watchUrl }: EmbedGuestRequiredProps) {
  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-5 px-4">
      <ReactionGif kind="guestDisabled" size={140} className="size-[140px]" />
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-white text-base font-semibold tracking-tight">
          {m.ui_embed_unavailable()}
        </p>
        <p className="text-fg-muted text-sm max-w-xs text-center">
          {m.ui_this_instance_does_not_allow_guest_access_which_is_required_for_embed()}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer rounded-md bg-white px-5 py-2 text-sm font-medium text-app transition-colors hover:bg-fg"
        >
          {m.ui_go_to_video()}
        </a>
      </div>
    </div>
  );
}
