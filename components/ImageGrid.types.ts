export interface ImageItem {
  src: string;
  alt: string;
  caption?: string;
}

export interface ImageGridProps {
  images: ImageItem[];
  captionBgClass?: string;
  captionTextClass?: string;
}
