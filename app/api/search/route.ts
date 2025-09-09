import { NextRequest, NextResponse } from "next/server";
import { vectorSearch } from "@/app/lib/vectorIndex";
import { embedById } from "@/app/lib/embeddings";
import { error } from "console";

export async function POST(req: NextRequest) {
    try {
        const { imageId, vector, topK = 10 } = await req.json();

        // Need either an id or a raw vector
        if (!imageId && !Array.isArray(vector)) {
            return NextResponse.json({ error: "imageId or vector required" }, { status: 400 });
        }

        // Get query vector (normalize happens in embedById)
        const query: number[] = imageId ? await embedById(imageId) : (vector as number[]);

        // Asking FAISS for top-k similar items
        const results = await vectorSearch(query, topK);

        return NextResponse.json({ results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "search_failed "}, { status: 500 });
    }
}