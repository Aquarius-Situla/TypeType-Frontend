import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiStore = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  notificationCenterOpen: boolean;
  searchTwitch: boolean;
  setSearchTwitch: (value: boolean) => void;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
  openNotificationCenter: () => void;
  closeNotificationCenter: () => void;
  toggleNotificationCenter: () => void;
};

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      notificationCenterOpen: false,
      searchTwitch: false,
      setSearchTwitch: (value) => set({ searchTwitch: value }),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      openMobileSidebar: () => set({ mobileSidebarOpen: true }),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      openNotificationCenter: () => set({ notificationCenterOpen: true }),
      closeNotificationCenter: () => set({ notificationCenterOpen: false }),
      toggleNotificationCenter: () =>
        set((state) => ({ notificationCenterOpen: !state.notificationCenterOpen })),
    }),
    {
      name: "typed-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        searchTwitch: state.searchTwitch,
      }),
    },
  ),
);
