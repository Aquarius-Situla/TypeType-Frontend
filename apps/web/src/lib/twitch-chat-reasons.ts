import { m } from "../paraglide/messages.js";

export type ChatRefusal = { message: string; follow: boolean };

export function chatRefusal(reason: string | undefined): ChatRefusal {
  const code = (reason ?? "").toUpperCase();
  const known = (message: string, follow = false) => ({ message, follow });
  if (code.includes("FOLLOWER")) return known(m.twitch_chat_reason_followers(), true);
  if (code.includes("SUB")) return known(m.twitch_chat_reason_subs());
  if (code.includes("EMOTE")) return known(m.twitch_chat_reason_emotes());
  if (code.includes("SLOW")) return known(m.twitch_chat_reason_slow());
  if (code.includes("DUPLICATE") || code.includes("R9K"))
    return known(m.twitch_chat_reason_duplicate());
  if (code.includes("VERIF")) return known(m.twitch_chat_reason_verify());
  if (code.includes("BAN") || code.includes("SUSPEND") || code.includes("TIMEOUT"))
    return known(m.twitch_chat_reason_banned());
  return known(code ? `${m.twitch_chat_rejected()} (${code})` : m.twitch_chat_rejected());
}
