export const TWITCH_CHAT_PANEL =
  "relative flex h-[28rem] flex-col overflow-hidden rounded-xl border border-border bg-surface lg:h-full";
// Over the fullscreen video the chat sits on a square veil across its whole column, barely there until the pointer
// comes over it; light text with a shadow, whatever the theme, stays readable on any frame.
export const TWITCH_CHAT_OVERLAY =
  "relative flex h-full flex-col overflow-hidden bg-black/10 transition-colors duration-200 hover:bg-black/45 motion-reduce:transition-none [text-shadow:0_1px_2px_rgb(0_0_0/0.95),0_0_6px_rgb(0_0_0/0.6)] [--color-border-strong:rgb(255_255_255/0.2)] [--color-border:rgb(255_255_255/0.12)] [--color-fg-muted:rgb(244_244_245/0.75)] [--color-fg-soft:rgb(244_244_245/0.6)] [--color-fg:#f4f4f5] [--color-surface-strong:rgb(255_255_255/0.12)] [--color-surface:transparent]";
