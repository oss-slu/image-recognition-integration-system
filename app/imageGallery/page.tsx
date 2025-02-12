import ImageGrid from "../../components/imageGrid"

const sampleImages = [
  { src: "/assets/cat.jpg", alt: "Sample Image 1", caption: "Image 1" },
  { src: "/assets/cat.jpg", alt: "Sample Image 2", caption: "Image 2" },
  { src: "/assets/cat.jpg", alt: "Sample Image 3", caption: "Image 3" },
  { src: "/assets/cat.jpg", alt: "Sample Image 4", caption: "Image 4" },
  { src: "/assets/cat.jpg", alt: "Sample Image 5", caption: "Image 5" },
  { src: "/assets/cat.jpg", alt: "Sample Image 6", caption: "Image 6" },
]

export default function imageDisplay() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Image Gallery</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <ImageGrid images={sampleImages} />
        </div>
      </main>
    </div>
  )
}
