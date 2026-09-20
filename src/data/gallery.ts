export interface GalleryImage {
  id: string;
  full: string;
  thumb: string;
  alt: string;
}

/** Photos live in public/gallery/, pre-resized and compressed (full: max
 * 1600px wide; thumb: 640x640 cropped) from the source WhatsApp exports. */
export const GALLERY_IMAGES: GalleryImage[] = Array.from({ length: 38 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return {
    id: num,
    full: `/gallery/gallery-${num}.jpg`,
    thumb: `/gallery/gallery-${num}-thumb.jpg`,
    alt: `Kopala ICR 2025 race day — photo ${i + 1}`,
  };
});
