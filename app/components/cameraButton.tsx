"use client";

import { Camera, CameraResultType } from "@capacitor/camera";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import config from "@/config/Setup.json";

const CameraButton = () => {
    const router = useRouter();
    const [isCapturing, setIsCapturing] = useState(false);

    const takePhoto = async () => {
        try {
            setIsCapturing(true);
            const photo = await Camera.getPhoto({
                quality: 100,
                resultType: CameraResultType.Uri, // ✅ Capture as a URI
                allowEditing: false,
            });

            if (!photo.webPath) {
                throw new Error("Photo capture failed");
            }


            console.log("Photo captured:", photo.webPath);
            // Convert to Base64 before sending
            const base64Image = await convertToBase64(photo.webPath);


            console.log("Base64 image:", base64Image);
            // Store Base64 image in localStorage
            await storeImageInIndexedDB(base64Image);
            // Send to Next.js API

            // Redirect to Image Gallery
            router.push("/imageGallery");
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
                            resolve(reader.result); // ✅ Base64 string
                        } else {
                            reject("Failed to convert image to Base64");
                        }
                    };
                })
                .catch(error => reject(error));
        });
    };
    const storeImageInIndexedDB = (base64Image: string) => {
        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open("ImageStorageDB", 1);
    
            request.onupgradeneeded = (event) => {
                const db = request.result;
                if (!db.objectStoreNames.contains("images")) {
                    db.createObjectStore("images", { keyPath: "id" });
                }
            };
    
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction("images", "readwrite");
                const store = transaction.objectStore("images");
    
                store.put({ id: "capturedImage", data: base64Image });
    
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
