// app/components/cameraButton.tsx

'use client';

import { Camera, CameraResultType } from "@capacitor/camera";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { AppConfig } from "@/types/config";

const CameraButton = () => {
  const router = useRouter();
  const [isCapturing, setIsCapturing] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);

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

  const takePhoto = async () => {
    try {
      setIsCapturing(true);
      const photo = await Camera.getPhoto({
        quality: 100,
        resultType: CameraResultType.Uri,
        allowEditing: false,
      });

      if (!photo.webPath) {
        throw new Error("Photo capture failed");
      }

      // Convert to Base64 before sending
      const base64Image = await convertToBase64(photo.webPath);

      // Generate a random UUID for this image
      const imageId = uuidv4();

      // Store Base64 image in IndexedDB with UUID
      await storeImageInIndexedDB(imageId, base64Image);

      // Redirect to Image Gallery with the UUID
      router.push(`/imageGallery?imageId=${imageId}`);
    } catch (error) {
      console.error("Camera error:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const convertToBase64 = (imageUri: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      fetch(imageUri)
        .then((response) => response.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result); // Base64 string
            } else {
              reject("Failed to convert image to Base64");
            }
          };
        })
        .catch((error) => reject(error));
    });
  };

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
    <button
      className={`px-4 py-2 ${config?.cameraButtonColor} rounded-lg text-white shadow-md`}
      onClick={takePhoto}
      disabled={isCapturing}
    >
      {isCapturing ? "Capturing..." : "Take Photo / Upload Image"}
    </button>
  );
};

export default CameraButton;
