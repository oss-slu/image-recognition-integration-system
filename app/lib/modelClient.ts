// // lib/modelClient.ts
// "use client";

 import { pipeline } from "@xenova/transformers";

 /** Singleton references to loaded pipelines */
 let imageEmbedder: any = null;

 /**
  * loading a CLIP embedding pipeline for image search (example).
  * this will make it easy to use other models
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
  * Extract embeddings from an image. 
  * Returns a vector (array of floats) we can then compare with our dataset.
  */
export async function getImageEmbeddings(image: Blob | string) {
   const embedder = await loadEmbeddingPipeline();
   // The pipeline returns a nested array. We'll flatten or keep it nested as needed.
   const result = await embedder(image);
   return result; 
}


//] Implement a universal model adapter in modelClient.ts to support Hugging Face Inference API and custom endpoints
import axios from 'axios';

// Define types for model configuration
interface ModelConfig {
    type: 'huggingface' | 'custom';
    endpoint: string;
    apiKey?: string; // Optional, for Hugging Face API
}

// Enable configuration-driven model selection (per-tenant JSON configs)

export class ModelClient {
    private config: ModelConfig;
    constructor(config: ModelConfig) {
        this.config = config;
    }
    async getEmbeddings(input: Blob | string): Promise<number[][]> {
        if (this.config.type === 'huggingface') {
            return this.getHuggingFaceEmbeddings(input);
        } else {
            return this.getEmbeddings(input);
        }   
    }

    private async getHuggingFaceEmbeddings(input: Blob | string): Promise<number[][]> {
        const headers: any = {};
        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        const response = await axios.post(this.config.endpoint, { inputs: input }, { headers });
        return response.data; // Assuming the API returns embeddings directly
    }
    private async getCustomEmbeddings(input: Blob | string): Promise<number[][]> {
        const response = await axios.post(this.config.endpoint, { data: input });
        return response.data; // Assuming the custom endpoint returns embeddings directly
    }
}

// Add documentation explaining how to onboard new models