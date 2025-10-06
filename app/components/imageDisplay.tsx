import Image from "next/image";

interface ImageDisplayProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}

export default function ImageDisplay({
  src,
  alt,
  width,
  height,
  caption,
}: ImageDisplayProps) {
  return (
    <div className="max-w-sm overflow-hidden rounded-sm shadow-lg">
      <div
        className="relative"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          fill
          style={{ objectFit: "cover" }}
        />
      </div>
      {caption && (
        <div className="px-6 py-4">
          <p className="text-base text-gray-700">{caption}</p>
        </div>
      )}
    </div>
  );
}
