import Image from "next/image";
import CameraButton from "./cameraButton";

export default function Search() {
  return (
    <div className="flex h-full flex-col items-center flex-1 items-center justify-center">

    <main className="w-80 h-80 border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg flex items-center justify-center bg-black-100">
      <Image
        className="w-full h-full object-cover"
        src="/sample.jpeg"
        alt="Space for Image Display"
        width={300}
        height={300}
      />
    </main>

    <div className="mt-4 flex space-x-4">
      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md">
        Select Image
      </button>
      <CameraButton />
    </div>
  </div>
  );
}
