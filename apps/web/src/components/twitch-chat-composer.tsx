import { type FormEvent, useEffect, useRef, useState } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { useTwitchFollow } from "../hooks/use-twitch-follow";
import { sendTwitchChatMessage } from "../lib/api-twitch";
import type { ChatEmoteMap } from "../lib/twitch-chat-parts";
import { type ChatRefusal, chatRefusal } from "../lib/twitch-chat-reasons";
import { chatDuration } from "../lib/twitch-duration";
import { insertEmote } from "../lib/twitch-emote-picker";
import { m } from "../paraglide/messages.js";
import type { TwitchRoomState } from "../types/twitch";
import { TwitchEmotePicker } from "./twitch-emote-picker";
import { TwitchFollowButton } from "./twitch-follow-button";

type Props = { login: string; room: TwitchRoomState | null; emotes: ChatEmoteMap };

function useCooldown(): [number, (seconds: number) => void] {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until <= now) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [until, now]);
  const left = Math.max(0, Math.ceil((until - now) / 1000));
  return [
    left,
    (seconds) => {
      setNow(Date.now());
      setUntil(Date.now() + seconds * 1000);
    },
  ];
}

function followWait(room: TwitchRoomState | null, followedAt: string | undefined): number {
  if (!room || room.followersOnly <= 0 || !followedAt) return 0;
  const left = room.followersOnly * 60_000 - (Date.now() - Date.parse(followedAt));
  return left > 0 ? Math.ceil(left / 60_000) : 0;
}

export function TwitchChatComposer({ login, room, emotes }: Props) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [refusal, setRefusal] = useState<ChatRefusal | null>(null);
  const [cooldown, startCooldown] = useCooldown();
  const follow = useTwitchFollow(login);
  const { locale } = useInterfaceLocale();
  const needsFollow =
    (refusal?.follow ?? false) ||
    (room !== null && room.followersOnly >= 0 && !follow.loading && !follow.following);
  const waitMinutes = followWait(room, follow.following ? follow.followedAt : undefined);
  const notice =
    refusal?.message ??
    (needsFollow
      ? m.twitch_chat_reason_followers()
      : waitMinutes > 0
        ? m.twitch_chat_follow_wait({ duration: chatDuration(waitMinutes, locale) })
        : null);

  function pickEmote(name: string) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? draft.length;
    const end = input?.selectionEnd ?? draft.length;
    const next = insertEmote(draft, start, end, name);
    if (!next) return;
    setDraft(next.text);
    setRefusal(null);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(next.caret, next.caret);
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending || cooldown > 0) return;
    setSending(true);
    setRefusal(null);
    try {
      const result = await sendTwitchChatMessage(login, message);
      if (result.ok) {
        setDraft("");
        if (room && room.slow > 0) startCooldown(room.slow);
      } else {
        setRefusal(
          result.rejected
            ? chatRefusal(result.reason)
            : { message: m.twitch_chat_send_failed(), follow: false },
        );
      }
    } catch {
      setRefusal({ message: m.twitch_chat_send_failed(), follow: false });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-border border-t">
      {notice && (
        <div role={refusal ? "alert" : undefined} className="flex items-center gap-3 px-3 pt-2">
          <p className={`flex-1 text-xs ${refusal ? "text-danger-strong" : "text-fg-muted"}`}>
            {notice}
          </p>
          {needsFollow && !follow.following && (
            <TwitchFollowButton login={login} returnTo={`/twitch/watch?c=${login}`} compact />
          )}
        </div>
      )}
      <form onSubmit={submit} className="flex gap-2 p-2">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setRefusal(null);
          }}
          maxLength={500}
          placeholder={m.twitch_chat_placeholder()}
          aria-label={m.twitch_chat_placeholder()}
          className="min-w-0 flex-1 rounded-lg border border-border bg-app px-3 py-1.5 text-fg text-sm"
        />
        <TwitchEmotePicker login={login} emotes={emotes} onPick={pickEmote} />
        <button
          type="submit"
          disabled={sending || cooldown > 0 || draft.trim().length === 0}
          className="min-w-16 rounded-lg bg-accent px-3 py-1.5 font-medium text-sm text-white disabled:opacity-50"
        >
          {cooldown > 0 ? m.twitch_chat_wait({ seconds: String(cooldown) }) : m.twitch_chat_send()}
        </button>
      </form>
    </div>
  );
}
