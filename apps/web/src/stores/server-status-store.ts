import { create } from "zustand";
import {
  INITIAL_SERVER_STATUS,
  type ServerHello,
  type ServerNotice,
  type ServerStatus,
  serverAnnounced,
  serverGreeted,
  serverLossConfirmed,
  serverLost,
  serverNoticeCleared,
  serverReached,
} from "../lib/server-status";

type ServerStatusStore = ServerStatus & {
  greeted: (hello: ServerHello) => void;
  announced: (notice: ServerNotice) => void;
  cleared: () => void;
  lost: () => void;
  lossConfirmed: () => void;
  reached: () => void;
};

export const useServerStatusStore = create<ServerStatusStore>((set) => ({
  ...INITIAL_SERVER_STATUS,
  greeted: (hello) => set((state) => serverGreeted(state, hello)),
  announced: (notice) => set((state) => serverAnnounced(state, notice)),
  cleared: () => set((state) => serverNoticeCleared(state)),
  lost: () => set((state) => serverLost(state)),
  lossConfirmed: () => set((state) => serverLossConfirmed(state)),
  reached: () => set((state) => serverReached(state)),
}));
