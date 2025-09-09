// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { vectorSearch } from "@/app/lib/vectorIndex";
import { embedById } from "@/app/lib/embeddings";

type Body = { imageId?: string; vector?: unknown; topK?: unknown };

function isNumberArray(x: unknown): x is number[] {
  return Array.isArray(x) && x.every((n) => typeof n === "number");
}

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json();

    // topK: default 10, clamp to [1, 100]
    let topK = 10;
    if (typeof body.topK === "number") {
      topK = Math.min(Math.max(Math.floor(body.topK), 1), 100);
    }

    // Building the query vector
    let query: number[];
    if (typeof body.imageId === "string" && body.imageId.length > 0) {
      query = await embedById(body.imageId); // normalized inside
    } else if (isNumberArray(body.vector)) {
      query = body.vector;
    } else {
      return NextResponse.json({ error: "imageId or vector required" }, { status: 400 });
    }

    const results = await vectorSearch(query, topK);
    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "search_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
