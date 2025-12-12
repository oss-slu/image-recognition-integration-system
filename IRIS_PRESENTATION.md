# How IRIS Works - Step by Step

## Overview
IRIS (Image Recognition Integration System) is an AI-powered image search application that finds similar images using CLIP embeddings and FAISS vector search.

---

## Step-by-Step Process

### **Phase 1: Image Indexing (Backend Setup)**
1. **Load Images**: Backend processes all images from the `images/` directory
2. **Upload to S3**: Images are uploaded to AWS S3 for cloud storage
3. **Generate Embeddings**: CLIP model (OpenAI's vision-language model) converts each image into a 512-dimensional vector
4. **Build FAISS Index**: All embeddings are stored in a FAISS index for fast similarity search
5. **Save Metadata**: Image URLs and index are saved to disk (`faiss_index.bin`, `image_urls.npy`)

### **Phase 2: User Image Capture (Frontend)**
1. **User Clicks Camera Button**: Triggers device camera or file picker
2. **Capture Photo**: Capacitor Camera API captures image
3. **Optimize Image**: Image is compressed to WebP format to reduce size
4. **Generate UUID**: Unique ID is created for the image
5. **Store Locally**: Image is saved to IndexedDB (browser storage) with ID and timestamp
6. **Navigate**: User is redirected to Image Gallery page with image ID

### **Phase 3: Image Search (Frontend → Backend)**
1. **Load Image**: Frontend retrieves image from IndexedDB using the ID
2. **Send to API**: Image (Base64 encoded) is sent to backend `/search` endpoint
3. **Receive Request**: Flask backend receives the image
4. **Decode & Save**: Base64 is decoded and saved temporarily
5. **Generate Query Embedding**: CLIP model creates embedding for the query image
6. **FAISS Search**: System searches for top 5 most similar images using L2 distance
7. **Return Results**: Backend returns list of S3 URLs for similar images

### **Phase 4: Display Results (Frontend)**
1. **Receive URLs**: Frontend receives array of similar image URLs
2. **Display Gallery**: Images are displayed in a responsive grid
3. **Show Query Image**: Original captured image is shown at the top
4. **Show Similar Images**: Top 5 similar images are displayed below

---

## Key Technologies

- **Frontend**: Next.js, React, TypeScript, Capacitor
- **Backend**: Flask, Python
- **AI Model**: CLIP (OpenAI's vision-language model)
- **Vector Search**: FAISS (Facebook AI Similarity Search)
- **Storage**: IndexedDB (client), S3 (cloud), FAISS index (server)
- **Image Format**: WebP (optimized)

---

## Architecture Flow

```
User → Camera → Optimize → IndexedDB → API Request → Flask Backend
                                                          ↓
                                                    CLIP Embedding
                                                          ↓
                                                    FAISS Search
                                                          ↓
                                                    S3 URLs → Frontend
                                                          ↓
                                                    Display Results
```

---

## Key Features

✅ **Cross-Platform**: Works on web, iOS, and Android  
✅ **Offline Storage**: Images stored locally in IndexedDB  
✅ **Fast Search**: FAISS enables sub-second similarity search  
✅ **Scalable**: Can handle thousands of images  
✅ **Optimized**: Images compressed to reduce bandwidth

