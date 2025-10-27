// // lib/modelClient.ts
"use client";

import { pipeline } from "@xenova/transformers";

// Loading API URL securely from environment variables
export const apiUrl = 
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Singleton references to the loaded image embedding pipeline
let imageEmbedder: any = null;

/**
 * Loading the image embedding pipeline
 * Initializing once and reusing across the app
 */
export async function loadEmbeddingPipeline() {
    if (!imageEmbedder) {
        // Using CLIP for image embeddings, just as an example
        imageEmbedder = await pipeline(
            "feature-extraction",
            "Xenova/clip-vit-base-patch32"
        );
    }
    return imageEmbedder;
}

/**
 * Extracting embeddings from an image
 * Returns a vector (array of floats) we can then compare with our dataset
 */
export async function getImageEmbeddings(image: Blob | string) {
    const embedder = await loadEmbeddingPipeline();
    // The pipeline returns a nested array. We'll flatten or keep it nested as needed
    const result = await embedder(image);
    return result; 
}

/**
 * Searching images using the backend API
 * Uses the secure API URL from environment variables
 */
export async function searchImages(query: string) {
    const response = await fetch(`${apiUrl}/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    return await response.json();
  }
