import { type GalleryItem, useGallery } from "../gallery-store";

export type { GalleryItem };

export function galleryItem(segment: number, side: "left" | "right"): GalleryItem | null {
  const items = useGallery.getState().items;
  if (items.length === 0) return null;
  const slot = segment * 2 + (side === "left" ? 0 : 1);
  return items[((slot % items.length) + items.length) % items.length] ?? null;
}
