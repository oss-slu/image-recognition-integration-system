// app/utils/imageOptimization.ts
// Used to compress or resize images before saving
// Works only on server side to avoid issues during build

let sharp: typeof import("sharp") | null = null;

// Only loading sharp on server
if (typeof window === "undefined") {
    try {
        sharp = require("sharp");
    } catch (err) {
        console.warn("Sharp not available, skipping optimization:", err);
    }
}

// This function compresses the images and converts into webp
export async function optimizeImage(
    buffer: Buffer,
    quality = 80,
    maxWidth = 1280
): Promise<Buffer> {
  if (!sharp) {
    console.log("Skipping optimization");
    return buffer;
  }

  try {
    const optimized = await sharp(buffer)
      .resize({ width: maxWidth, withoutEnlargement: true})
      .webp({ quality })
      .toBuffer();
    
    return optimized;
  } catch (err) {
    console.error("Error optimizing image:", err);
    return buffer;
  }
}

// Shows how much the image size was reduced
export function logCompression(before: number, after: number) {
    const saved = before - after;
    const percent = ((saved / before) * 100).toFixed(1);
    console.log(`compressed by ${percent}% (${(saved / 1024).toFixed(1)} KB saved)`);
}