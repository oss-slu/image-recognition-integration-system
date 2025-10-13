import Image from "next/image"

interface ImageItem {
  src: string
  alt: string
  caption?: string
}

interface ImageGridProps {
    images: ImageItem[]
    captionBgClass?: string
    captionTextClass?: string
  }

export default function ImageGrid({ images, captionBgClass = "bg-black bg-opacity-50", captionTextClass = "text-white" }: ImageGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4">

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
            <div className={`absolute inset-x-0 bottom-0 p-2 text-sm ${captionBgClass} ${captionTextClass} rounded-b-md backdrop-blur-sm`}>
              {image.caption}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}



