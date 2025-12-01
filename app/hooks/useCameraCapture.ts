"use client";

import { useState } from "react";
import { Camera, CameraResultType } from "@capacitor/camera";
import { v4 as uuidv4 } from "uuid";
import { optimizeImage, logCompression } from "../utils/imageOptimization";
import { storeImageBlob } from "../utils/indexedDbHelpers";

export default function useCameraCapture() {
  const [isCapturing, setIsCapturing] = useState(false);

  const takePhoto = async (): Promise<string | null> => {
    try {
      setIsCapturing(true);

      const photo = await Camera.getPhoto({
        quality: 100,
        resultType: CameraResultType.Uri,
        allowEditing: false,
      });

      if (!photo.webPath) return null;

      // Fetch image, get blob
      const response = await fetch(photo.webPath);
      const blob = await response.blob();

      // Convert blob -> ArrayBuffer -> Buffer for optimizeImage
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer as ArrayBuffer);
      const before = buffer.byteLength;

      const optimizedBuffer = await optimizeImage(buffer);
      const after = optimizedBuffer.byteLength;
      logCompression(before, after);

      // Convert optimized Buffer back to Blob (webp)
      const uint8 = Uint8Array.from(optimizedBuffer);
      const optimizedBlob = new Blob([uint8.buffer], { type: "image/webp" });

      // Store blob in IndexedDB
      const imageId = uuidv4();
      await storeImageBlob(imageId, optimizedBlob);

      return imageId;
    } catch (err) {
      console.error("useCameraCapture error:", err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  return { isCapturing, takePhoto };
}
