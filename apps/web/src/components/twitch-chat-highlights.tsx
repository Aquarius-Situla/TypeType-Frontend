import { useState } from "react";
import { useTwitchChatHighlights } from "../hooks/use-twitch-chat-highlights";
import { TwitchChatPinned } from "./twitch-chat-pinned";
import { TwitchChatPoll } from "./twitch-chat-poll";

// A hidden poll or pin stays hidden only until the channel starts another one, as on Twitch.
export function TwitchChatHighlights({ login }: { login: string }) {
  const { data, dataUpdatedAt } = useTwitchChatHighlights(login);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const hide = (id: string) => setHidden((current) => new Set(current).add(id));
  const poll = data?.poll && !hidden.has(data.poll.id) ? data.poll : null;
  const pinned = data?.pinned && !hidden.has(data.pinned.id) ? data.pinned : null;
  if (!poll && !pinned) return null;
  return (
    <>
      {pinned && <TwitchChatPinned pinned={pinned} onHide={() => hide(pinned.id)} />}
      {poll && (
        <TwitchChatPoll poll={poll} fetchedAt={dataUpdatedAt} onHide={() => hide(poll.id)} />
      )}
    </>
  );
}
