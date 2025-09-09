// Small helper around Universal Model Adapter
// Ensures the vector is L2-normalized (cosine works correctly)

import { getImageEmbeddings } from "@/app/lib/modelClient";

/**
 * get embedding vector for an image id (file path, url, or blob)
 * ensures result is 1-D array of floats, L2-normalized
 */
export async function embedById(image: Blob | string): Promise<number[]> {
    // Run through modelClient
    const raw = await getImageEmbeddings(image);

    // Flattern nested arrays if pipeline returned [ [ [ ... ] ] ]
    let v: number[] = [];
    if (Array.isArray(raw)) {
        v = raw.flat(Infinity) as number[];
    } else {
        throw new Error("embedding result is not array");
    }

    // Normalizing (cosine similarity requires unit length)
    const n = Math.sqrt(v.reduce((a, b) => a + b * b, 0)) || 1;
    return v.map((x) => x / n);
}