// Provides image embedding functions using @xenova/transformers

import { pipeline } from "@xenova/transformers";

// Keeping one instance of the pipeline alive (singleton)
let imageEmbedder: any = null;

/**
 * Loading CLIP embedding pipeline
 * Using Xenova/clip-vit-base-patch32 (works in Node and browser)
 */
export async function loadEmbeddingPipeline() {
    if (!imageEmbedder) {
        imageEmbedder = await pipeline(
            "feature-extraction",
            "Xenova/clip-vit-base-patch32"
        );
    }
    return imageEmbedder;
}

/**
 * Extracting embeddings from an image (Blob, URL, or file path)
 * Returns nested arrays from the model
 */
export async function getImageEmbeddings(image: Blob | string) {
    const embedder = await loadEmbeddingPipeline();
    const result = await embedder(image);
    return result; 
}
