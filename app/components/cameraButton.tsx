"use client";

import { Camera, CameraResultType } from "@capacitor/camera";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";

const CameraButton = () => {
    const router = useRouter();
    const [isCapturing, setIsCapturing] = useState(false);

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

            console.log("Photo captured:", photo.webPath);
            // Convert to Base64 before sending
            const base64Image = await convertToBase64(photo.webPath);
            
            // Generate a random UUID for this image
            const imageId = uuidv4();
            console.log("Generated image ID:", imageId);
            
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
                .then(response => response.blob())
                .then(blob => {
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
                .catch(error => reject(error));
        });
    };
    
    const storeImageInIndexedDB = (imageId: string, base64Image: string) => {
        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open("ImageStorageDB", 1);
    
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction("images", "readwrite");
                const store = transaction.objectStore("images");
    
                // Store with UUID as id
                store.put({ id: imageId, data: base64Image, timestamp: new Date().toISOString() });
    
                transaction.oncomplete = () => resolve();
                transaction.onerror = (error) => reject(error);
            };
    
            request.onerror = (error) => reject(error);
        });
    };

    return (
        <button 
            className={`px-4 py-2 ${config.cameraButtonColor} text-white rounded-lg shadow-md`}
            onClick={takePhoto}
            disabled={isCapturing}
        >
            {isCapturing ? "Capturing..." : "Use Camera"}
        </button>
    );
};

export default CameraButton;
