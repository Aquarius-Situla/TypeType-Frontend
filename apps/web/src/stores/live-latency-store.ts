import { create } from "zustand";
import { persist } from "zustand/middleware";

type LiveLatencyStore = {
  lowLatency: boolean;
  setLowLatency: (on: boolean) => void;
};

// Like the Twitch player, lives start in low latency; the viewer can trade it for a steadier stream.
export const useLiveLatencyStore = create<LiveLatencyStore>()(
  persist(
    (set) => ({
      lowLatency: true,
      setLowLatency: (lowLatency) => set({ lowLatency }),
    }),
    { name: "typetype-live-latency" },
  ),
);
