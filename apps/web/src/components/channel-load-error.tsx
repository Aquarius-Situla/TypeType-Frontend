import { m } from "../paraglide/messages.js";
import { ReactionGif } from "./reaction-gif";

type Props = { fetching: boolean; onRetry: () => void };

export function ChannelLoadError({ fetching, onRetry }: Props) {
  return (
    <section
      role="alert"
      className="flex w-full flex-col items-center justify-center gap-4 px-4 py-12 text-center"
    >
      <ReactionGif kind="videoError" size={140} className="size-28" />
      <h2 className="max-w-sm text-sm font-semibold leading-6 text-fg">
        {m.ui_unable_to_load_channel_right_now()}
      </h2>
      <button
        type="button"
        onClick={onRetry}
        disabled={fetching}
        className="inline-flex h-10 items-center justify-center rounded-md bg-fg px-4 text-sm font-medium text-app transition-colors hover:bg-fg-strong disabled:cursor-wait disabled:opacity-60"
      >
        {fetching ? m.ui_loading() : m.ui_retry()}
      </button>
    </section>
  );
}
