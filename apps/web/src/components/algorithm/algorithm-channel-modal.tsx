import { proxyImage } from "../../lib/proxy";
import { m } from "../../paraglide/messages.js";
import type { ProfileChannel } from "../../types/recommender";
import { ChannelAvatar } from "../channel-avatar";
import { basedOn } from "./algorithm-labels";

type Props = {
  channel: ProfileChannel;
  ignored: boolean;
  onToggleIgnored: () => void;
  onClose: () => void;
};

export function AlgorithmChannelModal({ channel, ignored, onToggleIgnored, onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <button
        type="button"
        aria-label={m.admin_users_close()}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative flex w-64 flex-col items-center gap-4 rounded-md border border-border bg-surface p-6">
        <ChannelAvatar
          src={channel.avatarUrl ? proxyImage(channel.avatarUrl) : ""}
          pending={false}
          name={channel.name}
          className="h-16 w-16"
        />
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-medium text-fg">{channel.name}</p>
          <p className="text-xs text-fg-soft">{basedOn(channel.from.length)}</p>
        </div>
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 flex-1 rounded-lg text-xs text-fg-muted transition-colors hover:bg-surface-strong hover:text-fg"
          >
            {m.admin_users_close()}
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleIgnored();
              onClose();
            }}
            className="h-9 flex-1 rounded-lg text-xs text-danger transition-colors hover:bg-surface-strong hover:text-danger-strong"
          >
            {ignored ? m.algo_count_again() : m.algo_ignore()}
          </button>
        </div>
      </div>
    </div>
  );
}
