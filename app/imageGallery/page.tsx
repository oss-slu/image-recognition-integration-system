/* eslint-disable @next/next/no-img-element */

"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { AppConfig } from "@/types/config";
import { getImageFromIndexedDB } from "../utils/indexedDbHelpers"; // Using helper

interface SimilarImage {
  src: string;
  alt: string;
}

function ImageGalleryContent() {
  const searchParams = useSearchParams();
  // Extract imageId directly
  const imageId = searchParams.get("imageId");
  const processedImageIdRef = useRef<string | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastProcessedImageIdRef = useRef<string | null>(null);

  const [config, setConfig] = useState<AppConfig | null>(null);
  const configRef = useRef<AppConfig | null>(null);
  const [similarImages, setSimilarImages] = useState<SimilarImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Loading app config
  useEffect(() => {
    fetch("/api/search?query=config")
      .then((response) => response.json())
      .then((data) => {
        configRef.current = data;
        setConfig(data);
      })
      .catch((error) => {
        console.error("Error loading config:", error);
      });
  }, []);

  // Sending base64 to the external API and collecting similar images
  const sendPhotoToAPI = useCallback(
    async (base64Image: string, config: AppConfig) => {
      setIsSearching(true);
      setSimilarImages([]);

      try {
        const { data } = await axios.post(
          config.imageApiUrl,
          { image: base64Image },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            withCredentials: false,
          }
        );

        if (data?.similar_images && Array.isArray(data.similar_images)) {
          const formatted = data.similar_images.map(
            (url: string, index: number) => ({
              src: url,
              alt: `Similar Image ${index + 1}`,
            })
          );
          setSimilarImages(formatted);
        } else {
          console.error("Unexpected API response format:", data);
          setSimilarImages([]);
        }
      } catch (error) {
        console.error("API request failed:", error);
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
      if (isProcessingRef.current) {
        return; // Prevent concurrent executions
      }

      isProcessingRef.current = true;
      try {
        const base64 = await getImageFromIndexedDB(id);
        if (!base64) {
          console.warn("No image found in IndexedDb with Id:", id);
          setImageData(null);
          setSimilarImages([]);
          setLoading(false);
          return;
        }

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
    // Early return if conditions aren't met
    if (!imageId || !configRef.current) {
      lastProcessedImageIdRef.current = null;
      return;
    }

    // Check if this is a different imageId than we've processed
    const isNewImageId = imageId !== lastProcessedImageIdRef.current;

    // Only process if: it's a new imageId and we're not currently processing
    if (isNewImageId && !isProcessingRef.current) {
      lastProcessedImageIdRef.current = imageId;
      processedImageIdRef.current = imageId;
      retrieveImageAndSearch(imageId, configRef.current);
    }
    // Only depend on imageId string value - config is accessed via ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId]);

  if (!config)
    return <div className="text-center text-white">Loading config...</div>;

  return (
    <div className={`min-h-screen ${config.appBackground} ${config.textColor}`}>
      <header className={`border-b shadow ${config.borderColor}`}>
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
                {similarImages.map((image) => (
                  <img
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    className={`h-40 w-full rounded-md object-cover ${config.cardBackground}`}
                  />
                ))}
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
