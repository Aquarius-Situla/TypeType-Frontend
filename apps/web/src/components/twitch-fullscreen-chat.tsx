import { selectFullscreen, usePlayer } from "@videojs/react";
import { MessageSquare, MessageSquareOff } from "lucide-react";
import { createPortal } from "react-dom";
import { usePlayerBarSlot } from "../hooks/use-player-bar-slot";
import { BAR_BUTTON } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { useTwitchFullscreenChatStore } from "../stores/twitch-fullscreen-chat-store";
import { TwitchChat } from "./twitch-chat";

// In fullscreen the live chat floats over the right of the video with no backdrop; a control bar button shows or
// hides it, and the choice is kept for the next live.
export function TwitchFullscreenChat({ login }: { login: string }) {
  const fullscreen = usePlayer(selectFullscreen)?.isFullscreen === true;
  const open = useTwitchFullscreenChatStore((state) => state.open);
  const toggle = useTwitchFullscreenChatStore((state) => state.toggle);
  const slot = usePlayerBarSlot();
  if (!fullscreen) return null;
  const label = open ? m.twitch_chat_hide() : m.twitch_chat_show();
  return (
    <>
      {slot &&
        createPortal(
          <button
            type="button"
            aria-pressed={open}
            aria-label={label}
            title={label}
            onClick={toggle}
            className={BAR_BUTTON}
          >
            {open ? (
              <MessageSquareOff className="size-5" aria-hidden="true" />
            ) : (
              <MessageSquare className="size-5" aria-hidden="true" />
            )}
          </button>,
          slot,
        )}
      {open && (
        <div className="absolute top-0 right-0 bottom-16 z-30 w-[22rem] max-w-[45%]">
          <TwitchChat login={login} overlay />
        </div>
      )}
    </>
  );
}
