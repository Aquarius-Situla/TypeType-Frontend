import type * as dashjs from "dashjs";
import { notifyDashPlayer, setDashPlayer } from "./dash-player-store";

const UPDATE_EVENTS = [
  "streamInitialized",
  "trackChangeRendered",
  "qualityChangeRendered",
] as const;
const listening = new WeakSet<dashjs.MediaPlayerClass>();

// Shares the dash.js player of the Video.js DASH adapter with the format choice, as the Vidstack player does.
export function registerDashPlayer(player: dashjs.MediaPlayerClass | null): void {
  setDashPlayer(player);
  if (!player || listening.has(player)) return;
  listening.add(player);
  for (const event of UPDATE_EVENTS) {
    player.on(event as dashjs.MediaPlayerEvents[keyof dashjs.MediaPlayerEvents], notifyDashPlayer);
  }
}
