import { create } from "zustand";

export type GalleryItem = {
  key: string;
  title: string;
  channelName: string;
  thumbnail: string;
};

type GalleryState = {
  items: GalleryItem[];
  setItems: (items: GalleryItem[]) => void;
};

export const useGallery = create<GalleryState>()((set) => ({
  items: [],
  setItems: (items) => set({ items }),
}));
