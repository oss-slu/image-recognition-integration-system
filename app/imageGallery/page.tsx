"use client";

import { useEffect, useState } from "react";
import ImageGrid from "../components/imageGrid";
import Spinner from "../components/spinner";
import axios from "axios";

export default function ImageGallery() {
    const [images, setImages] = useState<{ src: string; alt: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        retrieveImageFromIndexedDB();
    }, []);

    const retrieveImageFromIndexedDB = () => {
        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open("ImageStorageDB", 1);

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction("images", "readonly");
                const store = transaction.objectStore("images");
                const getRequest = store.get("capturedImage");

                getRequest.onsuccess = async () => {
                    if (getRequest.result) {
                        const base64Image = getRequest.result.data;
                        await sendPhotoToAPI(base64Image);
                        resolve();
                    } else {
                        console.warn("No image found in IndexedDB.");
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

    const sendPhotoToAPI = async (base64Image: string) => {
        setIsUploading(true);
        try {
            if(isUploading == true){
                <Spinner/>
            }
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
                    {images.length > 0 ? <ImageGrid images={images} /> : <p>No images found.</p>}
                    {isUploading && <Spinner/>}
                </div>
            </main>
        </div>
    );
}
