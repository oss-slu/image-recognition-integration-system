'use client';

import { ArrowLeft, Search, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { loadStoredImages, deleteImageFromIndexedDB, clearAllImagesFromIndexedDB } from '@/app/utils/indexedDbHelpers';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AppConfig } from '@/types/config';
import { createAnnotation } from '@/app/services/rerumClient';

export default function PreviousImages() {
  const [images, setImages] = useState<{ id: string; src: string; alt: string; caption?: string }[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('./setup.json')
      .then((res) => res.json())
      .then(setConfig)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const storedImages = await loadStoredImages();
        const formatted = storedImages.map((img) => ({
          id: img.id,
          src: img.data,
          alt: `Captured on ${img.timestamp}`,
          caption: new Date(img.timestamp).toLocaleString()
        }));
        setImages(formatted);
      } catch (err) {
        console.error("Failed to load images", err);
      }
    };
    fetchImages();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className={`sticky top-0 z-10 border-b bg-opacity-95 backdrop-blur ${config?.appBackground} ${config?.borderColor}`}>
        <div
          className="container flex items-center"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            height: 'calc(56px + env(safe-area-inset-top))',
          }}
        >
          <div className="flex items-center gap-2">
            <Link href="/">
              <button className={`hover:opacity-80 ${config?.buttonPrimary}`}>
                <ArrowLeft className="size-5" />
                <span className="sr-only">Back</span>
              </button>
            </Link>
            <h1 className={`text-lg font-semibold ${config?.headingColor}`}>Search History</h1>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {images.map((item, index) => (
              <div
                key={index}
                className={`overflow-hidden border ${config?.cardBackground} ${config?.borderColor} rounded-lg`}
              >
                <div className="relative aspect-video">
                  <Image src={item.src || "/placeholder.svg"} alt={item.alt} fill className="object-cover" />
                </div>
                <div className="flex flex-col items-start gap-2 p-4">
                  <div className="flex w-full justify-between">
                    <div>
                      <h3 className="line-clamp-1 font-medium text-gray-400">{item.caption}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="size-8 text-blue-400 hover:opacity-80"
                        onClick={() => router.push(`/imageGallery?imageId=${item.id}`)}
                      >
                        <Search className="size-4" />
                        <span className="sr-only">Search again</span>
                      </button>
                      <button
                        className="size-8 text-red-500 hover:opacity-80"
                        onClick={async () => {
                          try {
                            await deleteImageFromIndexedDB(item.id);
                            setImages((prev) => prev.filter((img) => img.id !== item.id));
                          } catch (err) {
                            console.error("Failed to delete image", err);
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete</span>
                      </button>
                    </div>
                  </div>

                  <button
                    className="text-sm text-green-500 underline"
                    onClick={() => setActiveAnnotationId(item.id)}
                  >
                    Annotate
                  </button>

                  {activeAnnotationId === item.id && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const annotation = {
                          type: "Annotation",
                          creator: "https://example.org/obsa",
                          body: {
                            value: `Title: ${title}, Tags: ${tags}`,
                            format: "text/plain"
                          },
                          target: item.id
                        };

                        try {
                          const response = await createAnnotation(annotation);
                          alert("Annotation saved! ID: " + response["@id"]);
                          setTitle('');
                          setTags('');
                          setActiveAnnotationId(null);
                        } catch (err) {
                          console.error(err);
                          alert("Failed to save annotation");
                        }
                      }}
                      className="w-full space-y-2 mt-2"
                    >
                      <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-1 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Tags (comma-separated)"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full p-1 border rounded"
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="bg-green-600 text-white px-2 py-1 rounded">Save</button>
                        <button type="button" onClick={() => setActiveAnnotationId(null)} className="text-red-500 text-sm">Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className={`mb-16 border-t px-6 py-4 pb-[env(safe-area-inset-bottom)] ${config?.borderColor}`}>
        <div className="container flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {images.length} items in history
          </p>
          <button
            className={`rounded border px-3 py-1 ${config?.borderColor} text-red-400 hover:bg-red-900/20`}
            onClick={async () => {
              try {
                await clearAllImagesFromIndexedDB();
                setImages([]);
              } catch (error) {
                console.error("Failed to clear history:", error);
              }
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Clear History
          </button>
        </div>
      </footer>
    </div>
  );
};