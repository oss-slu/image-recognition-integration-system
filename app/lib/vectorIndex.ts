// FAISS-only client used by Next.js API routes
// Endpints expected on the FAISS service: /health, /upsert, /delete, /search

export type SearchHit = {
    id: string; // image id (e.g., S3 key)
    score: number; // similarity score (cosine via inner product)
    metadata?: Record<string, unknown>;
};

type UpsertItem = {
    id: string;
    vector: number[]; // L2-normalized embedding
    metadata?: Record<string, unknown>;
};

// Reading from env
const FAISS_URL = process.env.FAISS_URL || "http://localhost:8000";

// Small helper to fail fast with readable message
async function ok(res: Response, label: string) {
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${label} failed (${res.status}) ${txt}`.trim());
    }
    return res;
}

// Adding or replacing a batch of vectors
export async function vectorUpsert(items: UpsertItem[]): Promise<void> {
    if (!items?.length) return; // Nothing to do
    const r = await fetch(`${FAISS_URL}/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application.json" },
        body: JSON.stringify({ items }),
        cache: "no-store",
    });
    await ok(r, "faiss upsert");
}

// Searching topK nearest neighbors for a query vector
export async function vectorSearch(query: number[], topK = 10): Promise<SearchHit[]> {
    if (!Array.isArray(query) || query.length === 0) return [];
    const k = Math.max(1, Math.min(Number(topK) || 10, 100)); // Clamp 1..100
    const r = await fetch(`${FAISS_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application.json" },
        body: JSON.stringify({ query, top_k: k }),
        cache: "no-store",
    });
    await ok(r, "faiss search");
    return (await r.json()) as SearchHit[]; // [{ if, score, metadata }]
}

// Deleting by ids (dev service rebuilds index internally)
export async function vectorDelete(ids: string[]): Promise<void> {
    if (!ids?.length) return;
    const r = await fetch(`${FAISS_URL}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application.json" },
        body: JSON.stringify({ ids }),
        cache: "no-store",
    });
    await ok(r, "faiss delete");
}

// Quick readiness check
export async function vectorPing(): Promise<boolean> {
    try {
        const r = await fetch(`${FAISS_URL}/health`, { cache: "no-store"});
        return r.ok;
    } catch {
        return false;
    }
}