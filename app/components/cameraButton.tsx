"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppConfig } from "@/types/config";
import useCameraCapture from "../hooks/useCameraCapture";
import Spinner from "./spinner";

const CameraButton = () => {
  const router = useRouter();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const { isCapturing, takePhoto } = useCameraCapture();

  useEffect(() => {
    fetch(`./setup.json`)
      .then((response) => response.json())
      .then((data) => {
        setConfig(data);
      })
      .catch((error) => {
        console.error("Error loading config:", error);
      });
  }, []);

  const handleClick = async () => {
    const id = await takePhoto();
    if (id) router.push(`/imageGallery?imageId=${id}`);
  };

  return (
    <div className="relative">
      <button
        className={`px-4 py-2 ${config?.cameraButtonColor} rounded-lg text-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2`}
        onClick={handleClick}
        disabled={isCapturing}
        aria-label={isCapturing ? "Capturing..." : "Use Camera"}
      >
        {isCapturing ? "Capturing..." : "Use Camera"}
      </button>
      {isCapturing && <Spinner />}
    </div>
  );
};

export default CameraButton;
