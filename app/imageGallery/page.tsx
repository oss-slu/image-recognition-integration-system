'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { AppConfig } from '@/types/config';

interface SimilarImage {
  src: string;
  alt: string;
}

type ImageData = {
  id: string;
  name: string;
  image: string;
  percentage: string;
};

function ImageGalleryContent() {
  const searchParams = useSearchParams();
  const imageId = searchParams.get('imageId');

  const [config, setConfig] = useState<AppConfig | null>(null);
  const [similarImages, setSimilarImages] = useState<SimilarImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [imageData, setImageData] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isPreviewClicked, setIsPrviewClicked] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | undefined>(undefined);
  const [dummyImageData, setDummyImageData] = useState<ImageData[]>([]);

  useEffect(() => {
    fetch('./setup.json')
      .then((response) => response.json())
      .then((data) => setConfig(data))
      .catch((error) => {
        console.error('Error loading config:', error);
      });
  }, []);

  useEffect(() => {
    if (config && imageId) {
      retrieveImageAndSearch(imageId, config);
    }
  }, [imageId, config]);

  useEffect(() => {
    fetchImageData();
  }, [])
  const retrieveImageAndSearch = (id: string, config: AppConfig) => {
    const request = indexedDB.open('ImageStorageDB', 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('images', 'readonly');
      const store = transaction.objectStore('images');
      const getRequest = store.get(id);

      getRequest.onsuccess = async () => {
        if (getRequest.result) {
          const base64Image = getRequest.result.data;
          setImageData(base64Image);
          setLoading(false);
          await sendPhotoToAPI(base64Image, config);
        } else {
          console.warn('No image found in IndexedDB with ID:', id);
          setSimilarImages([]);
        }
      };

      getRequest.onerror = () => {
        console.error('Error retrieving image from IndexedDB.');
      };
    };

    request.onerror = () => {
      console.error('Failed to access IndexedDB.');
    };
  };

  async function fetchImageData() {
    const response = await fetch('https://picsum.photos/v2/list?limit=40');
    const data = await response.json();

    const imageData = data.map((item: any, index: number) => ({
      id: item.id,
      name: item.author,
      image: `https://picsum.photos/id/${item.id}/500/300`,
      percentage: `${Math.floor(Math.random() * 41) + 60}%` // Random percentage between 60% and 100%
    }));
    setDummyImageData(imageData)
  }




  const sendPhotoToAPI = async (base64Image: string, config: AppConfig) => {
    setIsSearching(true);
    setSimilarImages([]);

    try {
      const { data } = await axios.post(
        config.imageApiUrl,
        { image: base64Image },
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
    } finally {
      setIsSearching(false);
    }
  };

  const tooglePreview = (img: string | undefined) => {
    setPreviewImage(img);
    setIsPrviewClicked(!isPreviewClicked);
  }

  if (!config) return <div className="text-center text-white">Loading config...</div>;
  if (isPreviewClicked) return (
    <div className='absolute flex flex-1 h-screen w-screen flex items-center justify-center bg-gray-900'>
      <img src={previewImage} className='object-cover' />
      <div className='absolute h-8 w-8 rounded-full bg-black top-10 left-10 flex items-center justify-center cursor-pointer' onClick={() => tooglePreview(imageData)}>
        <p>X</p>
      </div>
    </div>)

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
            <div className="mx-auto flex h-[200px] w-[300px] items-center justify-center overflow-hidden rounded-xl cursor-pointer" onClick={() => tooglePreview(imageData)}>
              <img src={imageData} alt="Captured" className={`h-40 w-60 rounded-md object-cover ${config.cardBackground}`} />
            </div>
          ) : (
            <p>No image found.</p>
          )}

          {/* {isSearching && (
            <div className={`text-center ${config.textColor}`}>
              Searching for similar images...
            </div>
          )} */}

          {/* {similarImages.length > 0 && (
            <div>
              <h2 className={`mb-4 ml-4 text-xl font-semibold ${config.headingColor}`}>
                Similar Images
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {similarImages.map((image) => (
                  <img
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    className={`h-40 w-full rounded-md object-cover ${config.cardBackground}`}
                  />
                ))}
              </div>
            </div>
          )} */}

          {dummyImageData.length > 0 && (
            <div>
              <h2 className={`mb-4 ml-4 text-xl font-semibold ${config.headingColor}`}>
                Similar Images
              </h2>
              <div className="grid grid-cols-2 px-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {dummyImageData.map((image) => (
                  <div className='h-[300px] w-[200px] flex flex-col items-center justify-center'>
                    <img
                      src={image.image}
                      className={`h-40 w-full rounded-md object-cover ${config.cardBackground}`}
                      onClick={() => tooglePreview(image.image)}
                    />
                    <h1>ImageName{image.id}</h1>
                    <h2>Similarity: {image.percentage}</h2>
                  </div>
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
