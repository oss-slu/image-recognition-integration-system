// lib/ModelClient.ts
"use client";

import { pipeline, Pipeline } from "@xenova/transformers";

/**
 * Singleton reference to the loaded CLIP embedding pipeline
 */
let imageEmbedder: Pipeline | null = null;

/**
 * Load the CLIP embedding pipeline (Xenova Transformers)
 */
export async function loadEmbeddingPipeline(): Promise<Pipeline> {
  if (!imageEmbedder) {
    imageEmbedder = await pipeline(
      "feature-extraction",
      "Xenova/clip-vit-base-patch32"
    );
  }
  return imageEmbedder;
}

/**
 * Extract embeddings from an image.
 * @param image - A Blob, File, or URL string
 * @returns A flattened array of floats (number[]) representing the image embedding
 */
export async function getImageEmbeddings(image: Blob | string): Promise<number[]> {
  const embedder = await loadEmbeddingPipeline();
  const result: unknown = await embedder(image);

  let embedding: number[];

  // Case 1: result is a nested array (number[][])
  if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
    embedding = result[0] as number[];

  // Case 2: result is an object with .data array (tensor-like)
  } else if (
    typeof result === "object" &&
    result !== null &&
    "data" in result &&
    Array.isArray((result as { data?: unknown }).data)
  ) {
    embedding = (result as { data: number[] }).data;

  // Case 3: fallback: treat result directly as number[]
  } else if (Array.isArray(result)) {
    embedding = result as number[];

  } else {
    throw new Error("Unable to parse embeddings from pipeline output");
  }

  return Array.from(embedding);
}
