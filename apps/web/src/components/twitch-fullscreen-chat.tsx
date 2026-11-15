import { selectFullscreen, usePlayer } from "@videojs/react";
import { MessageSquare, MessageSquareOff } from "lucide-react";
import { useState } from "react";
import { m } from "../paraglide/messages.js";
import { TwitchChat } from "./twitch-chat";

// In fullscreen the live chat floats over the right of the video, translucent, and can be hidden.
export function TwitchFullscreenChat({ login }: { login: string }) {
  const fullscreen = usePlayer(selectFullscreen)?.isFullscreen === true;
  const [open, setOpen] = useState(true);
  if (!fullscreen) return null;
  const label = open ? m.twitch_chat_hide() : m.twitch_chat_show();
  return (
    <>
      <button
        type="button"
        aria-pressed={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((value) => !value)}
        className={`absolute top-3 z-40 inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white ${open ? "right-[23rem]" : "right-3"}`}
      >
        {open ? (
          <MessageSquareOff className="size-4" aria-hidden="true" />
        ) : (
          <MessageSquare className="size-4" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div className="absolute inset-y-0 right-0 z-30 w-[22rem] max-w-[45%]">
          <TwitchChat login={login} overlay />
        </div>
      )}
    </>
  );
}
