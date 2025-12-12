/* eslint-disable @next/next/no-img-element */

"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { AppConfig } from "@/types/config";
import { getImageFromIndexedDB } from "../utils/indexedDbHelpers"; // Using helper

// Create a separate axios instance without default headers for external API calls
const externalApiClient = axios.create();

interface SimilarImage {
  src: string;
  alt: string;
}

function ImageGalleryContent() {
  const searchParams = useSearchParams();
  // Extract imageId directly
  const imageId = searchParams?.get("imageId") || null;
  const processedImageIdRef = useRef<string | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastProcessedImageIdRef = useRef<string | null>(null);

  const [config, setConfig] = useState<AppConfig | null>(null);
  const configRef = useRef<AppConfig | null>(null);
  const [similarImages, setSimilarImages] = useState<SimilarImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<SimilarImage | null>(null);

  // Loading app config
  useEffect(() => {
    // Load config directly from setup.json
    fetch("./setup.json")
      .then((response) => response.json())
      .then((data) => {
        console.log("✅ Config loaded:", data);
        console.log("✅ imageApiUrl:", data.imageApiUrl);
        configRef.current = data;
        setConfig(data);
      })
      .catch((error) => {
        console.error("❌ Error loading config from setup.json:", error);
      });
  }, []);

  // Sending base64 to the external API and collecting similar images
  const sendPhotoToAPI = useCallback(
    async (base64Image: string, config: AppConfig) => {
      console.log("🔍 sendPhotoToAPI called with config:", config);
      console.log("🔍 API URL:", config?.imageApiUrl);

      if (!config?.imageApiUrl) {
        console.error("❌ No imageApiUrl in config!");
        return;
      }

      setIsSearching(true);
      setSimilarImages([]);

      try {
        // Clean base64 string - remove data URL prefix if present
        const cleanBase64 = base64Image.includes(",")
          ? base64Image.split(",")[1]
          : base64Image;

        console.log("📤 Sending request to:", config.imageApiUrl);
        console.log("📤 Image data length:", cleanBase64.length);

        // Use externalApiClient (without default headers) to avoid CORS issues
        // The AuthContext sets Authorization header globally, but the image API doesn't need it
        const { data } = await externalApiClient.post(
          config.imageApiUrl,
          { image: cleanBase64 },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            withCredentials: false,
          }
        );

        console.log("📥 API response received:", JSON.stringify(data, null, 2));

        // Check multiple possible response formats
        let imageUrls: string[] = [];

        if (data?.similar_images && Array.isArray(data.similar_images)) {
          imageUrls = data.similar_images;
        } else if (data?.images && Array.isArray(data.images)) {
          imageUrls = data.images;
        } else if (data?.results && Array.isArray(data.results)) {
          imageUrls = data.results;
        } else if (Array.isArray(data)) {
          imageUrls = data;
        }

        if (imageUrls.length > 0) {
          const formatted = imageUrls.map((url: string, index: number) => ({
            src: url,
            alt: `Similar Image ${index + 1}`,
          }));
          setSimilarImages(formatted);
          console.log("Found", formatted.length, "similar images");
        } else {
          console.warn("No images found in response. Full response:", data);
          setSimilarImages([]);
        }
      } catch (error: any) {
        console.error("API request failed:", error);
        if (error.response) {
          console.error("Response status:", error.response.status);
          console.error("Response data:", error.response.data);
        } else if (error.request) {
          console.error("No response received. Request:", error.request);
        }
        setSimilarImages([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  // Retrieving image and trigger search
  const retrieveImageAndSearch = useCallback(
    async (id: string, config: AppConfig) => {
      console.log("🖼️ retrieveImageAndSearch called with imageId:", id);
      console.log("🖼️ Config available:", !!config);
      console.log("🖼️ imageApiUrl:", config?.imageApiUrl);

      if (isProcessingRef.current) {
        console.log("⏸️ Already processing, skipping...");
        return; // Prevent concurrent executions
      }

      isProcessingRef.current = true;
      try {
        const base64 = await getImageFromIndexedDB(id);
        if (!base64) {
          console.warn("⚠️ No image found in IndexedDb with Id:", id);
          setImageData(null);
          setSimilarImages([]);
          setLoading(false);
          return;
        }

        console.log(
          "✅ Image retrieved from IndexedDB, length:",
          base64.length
        );
        setImageData(base64);
        setLoading(false);
        await sendPhotoToAPI(base64, config);
      } catch (e) {
        console.error("Error retrieving image from indexedDB", e);
        setImageData(null);
        setSimilarImages([]);
        setLoading(false);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [sendPhotoToAPI]
  );

  // When config and imageId are ready, fetching image and running similarity search
  useEffect(() => {
    console.log(
      "🔄 useEffect triggered - imageId:",
      imageId,
      "config:",
      !!configRef.current
    );

    // Early return if conditions aren't met
    if (!imageId || !configRef.current) {
      console.log("⏳ Waiting for imageId or config...", {
        imageId,
        hasConfig: !!configRef.current,
      });
      lastProcessedImageIdRef.current = null;
      return;
    }

    // Check if this is a different imageId than we've processed
    const isNewImageId = imageId !== lastProcessedImageIdRef.current;

    // Only process if: it's a new imageId and we're not currently processing
    if (isNewImageId && !isProcessingRef.current) {
      console.log("🚀 Starting image search for:", imageId);
      lastProcessedImageIdRef.current = imageId;
      processedImageIdRef.current = imageId;
      retrieveImageAndSearch(imageId, configRef.current);
    } else {
      console.log("⏭️ Skipping - already processed or processing:", {
        isNewImageId,
        isProcessing: isProcessingRef.current,
      });
    }
  }, [imageId, config, retrieveImageAndSearch]);

  if (!config)
    return <div className="text-center text-white">Loading config...</div>;

  return (
    <div className={`min-h-screen ${config.appBackground} ${config.textColor}`}>
      <header className={`border-b shadow ${config.borderColor} pt-16`}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className={`text-3xl font-bold ${config.headingColor}`}>
            Image Gallery
          </h1>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <h2
            className={`mb-2 ml-4 text-xl font-semibold ${config.headingColor}`}
          >
            Queried image
          </h2>
          {loading ? (
            <p>Loading input image...</p>
          ) : imageData ? (
            <div className="mx-auto flex h-[200px] w-[300px] items-center justify-center overflow-hidden rounded-xl">
              {/* optimized image already in Base64 WebP */}
              <img
                src={imageData}
                alt="Captured"
                loading="lazy"
                className={`h-40 w-60 rounded-md object-cover ${config.cardBackground}`}
              />
            </div>
          ) : (
            <p>No image found.</p>
          )}

          {isSearching && (
            <div className={`text-center ${config.textColor}`}>
              Searching for similar images...
            </div>
          )}

          {similarImages.length > 0 && (
            <div>
              <h2
                className={`mb-4 ml-4 text-xl font-semibold ${config.headingColor}`}
              >
                Similar Images
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {similarImages.map((image) => {
                  // Extract filename from path/URL
                  const getFileName = (path: string) => {
                    try {
                      // Handle URLs
                      if (path.includes("/")) {
                        const parts = path.split("/");
                        return parts[parts.length - 1].split("?")[0]; // Remove query params if any
                      }
                      // Handle local paths
                      if (path.includes("\\")) {
                        const parts = path.split("\\");
                        return parts[parts.length - 1];
                      }
                      return path;
                    } catch {
                      return path;
                    }
                  };
                  const fileName = getFileName(image.src);

                  return (
                    <div
                      key={image.src}
                      className="flex flex-col cursor-pointer transition-transform hover:scale-105"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image.src}
                        alt={image.alt}
                        loading="lazy"
                        className={`h-40 w-full rounded-md object-cover ${config.cardBackground}`}
                      />
                      <p
                        className={`mt-2 text-xs break-all ${config.textColor}`}
                        title={image.src}
                      >
                        {fileName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isSearching && similarImages.length === 0 && (
            <div className="text-center text-gray-500">
              No similar images found.
            </div>
          )}
        </div>
      </main>

      {/* Image Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className={`relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg ${config.cardBackground} ${config.textColor} shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className={`absolute top-4 right-4 z-10 rounded-full p-2 ${config.borderColor} border-2 hover:bg-opacity-20 transition-colors`}
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="p-6">
              <h3 className={`mb-4 text-2xl font-bold ${config.headingColor}`}>
                Image Details
              </h3>

              {/* Larger Image Preview */}
              <div className="mb-6 flex justify-center">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="max-w-full max-h-[500px] rounded-lg object-contain"
                />
              </div>

              {/* Metadata Section */}
              <div
                className={`mt-6 space-y-4 ${config.borderColor} border-t pt-6`}
              >
                <h4
                  className={`text-xl font-semibold mb-4 ${config.headingColor}`}
                >
                  Metadata
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${config.textColor} opacity-70`}
                    >
                      Screw Manufacturer
                    </label>
                    <p className={`text-base ${config.textColor}`}>
                      <span className="opacity-50">Placeholder</span>
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${config.textColor} opacity-70`}
                    >
                      Screw Model
                    </label>
                    <p className={`text-base ${config.textColor}`}>
                      <span className="opacity-50">Placeholder</span>
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${config.textColor} opacity-70`}
                    >
                      Screw Type
                    </label>
                    <p className={`text-base ${config.textColor}`}>
                      <span className="opacity-50">Placeholder</span>
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${config.textColor} opacity-70`}
                    >
                      Screw Dimensions
                    </label>
                    <p className={`text-base ${config.textColor}`}>
                      <span className="opacity-50">Placeholder</span>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${config.textColor} opacity-70`}
                    >
                      Anatomical Placement
                    </label>
                    <p className={`text-base ${config.textColor}`}>
                      <span className="opacity-50">Placeholder</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImageGallery() {
  return (
    <Suspense
      fallback={<div className="text-center text-white">Loading...</div>}
    >
      <ImageGalleryContent />
    </Suspense>
  );
}
