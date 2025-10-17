// app/lib/modelClient.ts

export type EmbeddingRequest = { imageId?: string; dataUrl?: string };
export type EmbeddingResponse = { vector: number[] };

function isEmbeddingResponse(x: unknown): x is EmbeddingResponse {
  const r = x as { vector?: unknown };
  return Array.isArray(r?.vector) && r.vector.every((n) => typeof n === "number");
}

/** Getying an embedding for an image by its ID (e.g., S3 key) via your embed API. */
export async function getEmbeddingForImageId(id: string): Promise<number[]> {
  const res = await fetch("/api/model/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageId: id } as EmbeddingRequest),
    cache: "no-store",
  });

  const json: unknown = await res.json();
  if (!isEmbeddingResponse(json)) throw new Error("Bad embed response (imageId)");
  return json.vector;
}

/** Getting an embedding for raw image data (e.g., data URL) via your embed API. */
export async function getEmbeddingForImageData(dataUrl: string): Promise<number[]> {
  const res = await fetch("/api/model/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl } as EmbeddingRequest),
    cache: "no-store",
  });

  const json: unknown = await res.json();
  if (!isEmbeddingResponse(json)) throw new Error("Bad embed response (dataUrl)");
  return json.vector;
}
