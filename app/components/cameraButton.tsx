"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { AppConfig } from "@/types/config";
import useCameraCapture from "../hooks/useCameraCapture";
import Spinner from "./spinner";
import { optimizeImage, logCompression } from "../utils/imageOptimization";

const CameraButton = () => {
  const router = useRouter();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const { isCapturing, takePhoto: capturePhoto } = useCameraCapture();

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
    try {
      const photo = await capturePhoto();
      if (!photo?.webPath) {
        throw new Error("Photo capture failed");
      }

      console.log("Photo captured:", photo.webPath);

      // Converting URI -> blob -> buffer for optimization
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const before = buffer.byteLength;

      // Compressing image using Sharp (server-side)
      const optimizedBuffer = await optimizeImage(buffer);
      const after = optimizedBuffer.byteLength;

      // Log compression info
      logCompression(before, after);

      // Converting optimized buffer -> Base64
      const base64Optimized = await bufferToBase64(optimizedBuffer);

      // Generating image ID and storing optimized version
      const imageId = uuidv4();
      console.log("Generating image ID:", imageId);
      await storeImageInIndexedDB(imageId, base64Optimized);

      // Redirecting to gallery
      router.push(`/imageGallery?imageId=${imageId}`);
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  // Converting buffer to Base64
  const bufferToBase64 = (buffer: Buffer): Promise<string> => {
    return new Promise((resolve) => {
      const blob = new Blob([new Uint8Array(buffer)], { type: "image/webp" });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result); // Base64 string
        }
      };
    });
  };

  // Stores optimized Base64 image in IndexedDB
  const storeImageInIndexedDB = (imageId: string, base64Image: string) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("ImageStorageDB", 1);

      request.onupgradeneeded = () => {
        const db = request.result;

        // Only create object store if it doesn't exist
        if (!db.objectStoreNames.contains("images")) {
          db.createObjectStore("images", { keyPath: "id" });
        }
      };

      request.onsuccess = () => {
        const db = request.result;

        // Start a transaction to store the image
        const transaction = db.transaction("images", "readwrite");
        const store = transaction.objectStore("images");

        // Store the image with the generated UUID as the key
        store.put({
          id: imageId,
          data: base64Image,
          timestamp: new Date().toISOString(),
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject(event);
      };

      request.onerror = (event) => reject(event);
    });
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
