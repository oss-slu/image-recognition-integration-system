'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { AppConfig } from '@/types/config';
import { getImageFromIndexedDB } from '../utils/indexedDbHelpers';

interface SimilarImage {
  src: string;
  alt: string;
}

function ImageGalleryContent() {
  const searchParams = useSearchParams();
  const imageId = searchParams.get('imageId');

  const [config, setConfig] = useState<AppConfig | null>(null);
  const [similarImages, setSimilarImages] = useState<SimilarImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('./setup.json')
      .then((response) => response.json())
      .then((data) => setConfig(data))
      .catch((error) => {
        console.error('Error loading config:', error);
      });
  }, []);

  // Previously helper functions for retrieving and sending the image were
  // declared here. The logic has been inlined into the effect below to
  // satisfy react-hooks/exhaustive-deps and avoid stale closures.

  useEffect(() => {
    if (!config) return;

    if (!imageId) {
      setLoading(false);
      setSimilarImages([]);
      return;
    }

    const runSearch = async () => {
      setIsSearching(true);
      setSimilarImages([]);

      try {
        const base64 = await getImageFromIndexedDB(imageId);

        if (!base64) {
          console.warn('No image found in IndexedDb with ID:', imageId);
          setImageData(null);
          setSimilarImages([]);
          setLoading(false);
          return;
        }

        setImageData(base64);
        setLoading(false);

        try {
          const { data } = await axios.post(
            config.imageApiUrl,
            { image: base64 },
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              withCredentials: false,
            }
          );

          if (data?.similar_images && Array.isArray(data.similar_images)) {
            const formatted = data.similar_images.map((url: string, index: number) => ({
              src: url,
              alt: `Similar Image ${index + 1}`,
            }));
            setSimilarImages(formatted);
          } else {
            console.error('Unexpected API response format:', data);
            setSimilarImages([]);
          }
        } catch (error) {
          console.error('API request failed:', error);
          setSimilarImages([]);
        }
      } catch (e) {
        console.error('Error retrieving image from indexedDB', e);
        setImageData(null);
        setSimilarImages([]);
        setLoading(false);
      } finally {
        setIsSearching(false);
      }
    };

    void runSearch();
  }, [imageId, config]);

  if (!config) return <div className="text-center text-white">Loading config...</div>;

  return (
    <div className={`min-h-screen ${config.appBackground} ${config.textColor}`}>
      <header className={`border-b shadow ${config.borderColor}`}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className={`text-3xl font-bold ${config.headingColor}`}>Image Gallery</h1>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <h2 className={`mb-2 ml-4 text-xl font-semibold ${config.headingColor}`}>Queried image</h2>
          {loading ? (
            <p>Loading input image...</p>
          ) : imageData ? (
            <div className="mx-auto flex h-[200px] w-[300px] items-center justify-center overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageData} alt="Captured" className={`h-40 w-60 rounded-md object-cover ${config.cardBackground}`} />
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
              <h2 className={`mb-4 ml-4 text-xl font-semibold ${config.headingColor}`}>
                Similar Images
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {similarImages.map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    className={`h-40 w-full rounded-md object-cover ${config.cardBackground}`}
                  />
                ))}
              </div>
            </div>
          )}

          {!isSearching && similarImages.length === 0 && (
            <div className="text-center text-gray-500">No similar images found.</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ImageGallery() {
  return (
    <Suspense fallback={<div className="text-center text-white">Loading...</div>}>

      <ImageGalleryContent />

    </Suspense>
  );
}
