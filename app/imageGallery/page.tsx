"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ImageGrid from "../components/imageGrid";
import Spinner from "../components/spinner";
import axios from "axios";

interface StoredImage {
    id: string;
    data: string; // base64 image data
    timestamp: string;
}

export default function ImageGallery() {
    const searchParams = useSearchParams();
    const imageId = searchParams.get("imageId");
    
    const [images, setImages] = useState<{ src: string; alt: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [storedImages, setStoredImages] = useState<StoredImage[]>([]);

    useEffect(() => {
        if (imageId) {
            // If an imageId is provided, retrieve and process that specific image
            retrieveSpecificImageFromIndexedDB(imageId);
        }
        
        // Also load list of all stored images
        loadStoredImages();
    }, [imageId]);

    const loadStoredImages = () => {
        const request = indexedDB.open("ImageStorageDB", 1);

        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction("images", "readonly");
            const store = transaction.objectStore("images");
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
                const images = getAllRequest.result.map(img => ({
                    id: img.id,
                    data: img.data,
                    timestamp: img.timestamp || 'Unknown date'
                }));
                
                // Sort by timestamp, newest first
                images.sort((a, b) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                
                setStoredImages(images);
            };
        };
    };

    const retrieveSpecificImageFromIndexedDB = (id: string) => {
        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open("ImageStorageDB", 1);

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction("images", "readonly");
                const store = transaction.objectStore("images");
                const getRequest = store.get(id);

                getRequest.onsuccess = async () => {
                    if (getRequest.result) {
                        const base64Image = getRequest.result.data;
                        await sendPhotoToAPI(base64Image);
                        resolve();
                    } else {
                        console.warn("No image found in IndexedDB with ID:", id);
                        reject("No image found");
                    }
                };

                getRequest.onerror = () => {
                    reject("Error retrieving image from IndexedDB.");
                };
            };

            request.onerror = () => {
                reject("IndexedDB access failed.");
            };
        });
    };

    const loadImageById = (id: string) => {
        retrieveSpecificImageFromIndexedDB(id);
    };

    const sendPhotoToAPI = async (base64Image: string) => {
        setIsUploading(true);
        setImages([]); // Clear previous results
        
        try {
            const { data } = await axios.post(
                "http://192.168.123.110:5000/search",
                { image: base64Image },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    withCredentials: false,
                });

            if (data?.similar_images && Array.isArray(data.similar_images)) {
                const formattedImages = data.similar_images.map((url: string, index: number) => ({
                    src: url,
                    alt: `Similar Image ${index + 1}`,
                }));
                setImages(formattedImages);
            } else {
                console.error("Unexpected API response format:", data);
            }
        } catch (error) {
            console.error("Error uploading image:", error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">Image Gallery</h1>
                </div>
            </header>
            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {/* Previously captured images gallery */}
                    {storedImages.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4 text-black">Images</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {storedImages.map((image) => (
                                    <div 
                                        key={image.id} 
                                        className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => loadImageById(image.id)}
                                    >
                                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
                                            <img 
                                                src={image.data} 
                                                alt="Captured image"
                                                className="object-cover w-full h-40"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}