// // lib/modelClient.ts
// "use client";

// import { pipeline } from "@xenova/transformers";

// /** Singleton references to loaded pipelines */
// let imageEmbedder: any = null;

// /**
//  * loading a CLIP embedding pipeline for image search (example).
//  * this will make it easy to use other models
//  */
// export async function loadEmbeddingPipeline() {
//   if (!imageEmbedder) {
//     // Using CLIP for image embeddings, just as an example
//     imageEmbedder = await pipeline(
//       "feature-extraction",
//       "Xenova/clip-vit-base-patch32"
//     );
//   }
//   return imageEmbedder;
// }

// /**
//  * Extract embeddings from an image.
//  * Returns a vector (array of floats) we can then compare with our dataset.
//  */
// export async function getImageEmbeddings(image: Blob | string) {
//   const embedder = await loadEmbeddingPipeline();
//   // The pipeline returns a nested array. We'll flatten or keep it nested as needed.
//   const result = await embedder(image);
//   return result;
// }
