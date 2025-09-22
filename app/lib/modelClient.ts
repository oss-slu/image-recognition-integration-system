//lib/ModelClient.ts
"use client";

import { pipeline } from "@xenova/transformers";

// /** Singleton references to loaded pipelines */
 let imageEmbedder: any = null;

// /**
//  * loading a CLIP embedding pipeline for image search (example).
//  * this will make it easy to use other models
//  */
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

// /**
//  * Extract embeddings from an image. 
//  * Returns a vector (array of floats) we can then compare with our dataset.
//  */
 export async function getImageEmbeddings(image: Blob | string) : Promise<number[]> {
   const embedder = await loadEmbeddingPipeline();
   // The pipeline returns a nested array. We'll flatten or keep it nested as needed.
   const result = await embedder(image);
    let embedding: number[];

  if (Array.isArray(result) && Array.isArray(result[0])) {
    embedding = result[0] as number[];
  } else if ("data" in result && Array.isArray((result as any).data)) {
    embedding = (result as any).data;
  } else {
    // fallback: try to cast directly
    embedding = result as number[];
  }
    return Array.from(embedding);
 }


import axios from "axios";

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
}

export interface EmbeddingRequest {
  inputs: string[]; // text or image URLs
}

export interface ModelConfig {
  name: string;
  type: "huggingface" | "custom";
  endpoint: string;
  apiKey?: string;
}

/**
 * Standardized client for embedding models.
 * Supports Hugging Face Inference API and custom endpoints.
 */
export class ModelClient {
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  async embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
    switch (this.config.type) {
      case "huggingface":
        return this.callHuggingFace(req);
      case "custom":
        return this.callCustom(req);
      default:
        throw new Error(`Unsupported model type: ${this.config.type}`);
    }
  }

  private async callHuggingFace(
    req: EmbeddingRequest
  ): Promise<EmbeddingResponse> {
    const response = await axios.post(
      this.config.endpoint,
      { inputs: req.inputs },
      {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      }
    );

    return {
      embeddings: response.data.embeddings || response.data,
      model: this.config.name,
    };
  }

  private async callCustom(
    req: EmbeddingRequest
  ): Promise<EmbeddingResponse> {
    const response = await axios.post(this.config.endpoint, req);

    return {
      embeddings: response.data.embeddings,
      model: this.config.name,
    };
  }
}
