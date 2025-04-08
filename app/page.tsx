import CameraButton from "@/app/components/cameraButton";
import NavigationBar from "@/app/components/navigationBar";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen relative">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-semibold text-gray-800 mb-8 text-center">
          Click below to upload image
        </h1>
        <div className="flex space-x-4">
          <CameraButton />
        </div>
      </div>
      <NavigationBar />
    </div>
  );
}
