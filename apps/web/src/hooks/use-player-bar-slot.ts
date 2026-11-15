import { createContext, useContext } from "react";

// A spot in the Video.js live control bar where a page adds its own button, such as the Twitch chat toggle.
export const PlayerBarSlotContext = createContext<HTMLElement | null>(null);
export const usePlayerBarSlot = () => useContext(PlayerBarSlotContext);
