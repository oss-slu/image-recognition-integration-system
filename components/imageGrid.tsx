import Image from "next/image"

interface ImageItem {
  src: string
  alt: string
  caption?: string
}

interface ImageGridProps {
  images: ImageItem[]
}

export default function ImageGrid({ images }: ImageGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
      {images.map((image, index) => (
        <div key={index} className="relative aspect-square overflow-hidden rounded-lg shadow-md">
          <Image
            src={image.src || "/placeholder.svg"}
            alt={image.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            style={{ objectFit: "cover" }}
          />
          {image.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
              {image.caption}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}



