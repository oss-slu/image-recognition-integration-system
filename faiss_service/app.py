# Small FastAPI app that wraps a FAISS index
# - Stores vectors in memory (ok for local dev)
# - Uses cosine similarity by normalizing vectors and IndexFlatIP
# - Endpoints: /health, /upsert, /delete, /search

import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Set
import numpy as np
import faiss

app = FastAPI()

DIM = int(os.getenv("EMBEDDING_DIM", "384"))
MAX_TOPK = int(os.getenv("MAX_TOPK", "100"))
index = faiss.IndexFlatIP(DIM) # Inner product -> cosine if vectors are L2-normalized
id_map: List[str] = [] # Keeps ids parallel to FAISS rows
meta_map: Dict[str, Dict[str, Any]] = {} # id -> metadata
tombstones: Set[str] = set()

# Payloading schemas
class UpsertItem(BaseModel):
    id: str
    vector: List[float]
    metadata: Dict[str, Any] | None = None

class UpsertPayload(BaseModel):
    items: List[UpsertItem]

class DeletePayload(BaseModel):
    ids: List[str]

class SearchPayload(BaseModel):
    query: list[float]
    top_k: int = 10

# Helpers
def l2_normalize(v: np.ndarray) -> np.ndarray:
    n = np.linalg.norm(v)
    return v / n if n > 0 else v

def normalize_matrix(X: np.ndarray) -> np.ndarray:
    # Normalizing each row to unit length
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return X / norms

# Routes
@app.get("/health")
def health():
    return {
        "ok": True, 
        "count": int(index.ntotal), 
        "dim": DIM, 
        "max_topk": MAX_TOPK,
        "tombstones": len(tombstones),
    }

@app.post("/upsert")
def upsert(p: UpsertPayload):
    global index, id_map
    if not p.items:
        return {"added": 0}
    
    # Building matrix of vectors, normalize rows for cosine
    vecs = []
    for it in p.items:
        if len(it.vector) != DIM:
            raise HTTPException(status_code=422,
                                detail=f"Vector for id '{it.id}' has dim={len(it.vector)} but EMBEDDING_DIM={DIM}")
        v = np.asarray(it.vector, dtype="float32")
        v = l2_normalize(v)
        vecs.append(v)
        meta_map[it.id] = it.metadata or {}
    
    X = np.vstack(vecs).astype("float32")
    index.add(X) # Appending to FAISS
    id_map.extend([it.id for it in p.items])
    return {"added": len(p.items)}

@app.post("/delete")
def delete(p: DeletePayload):
    # Soft delete: mark IDs as tombstoned; rebuild happens in /compact
    if not p.ids:
        return {"deleted": 0}
    before = len(tombstones)
    tombstones.update(p.ids)
    return {"deleted": len(tombstones) - before}
    
@app.post("/compact")
def compact():
    """
    Physically rebuilding the index, dropping tombstoned ids
    Run this occassionally
    """
    global index, id_map
    if index.ntotal == 0 or not tombstones:
        return {"compacted": 0, "remaining": int(index.ntotal)}

    # Reconstructing all vectors
    X = index.reconstruct_n(0, index.ntotal) # (N, DIM) float32
    keep_idx = [i for i, _id in enumerate(id_map) if _id not in tombstones]

    X_keep = X[keep_idx].astype("float32") if keep_idx else np.empty((0, DIM), dtype="float32")
    ids_keep = [id_map[i] for i in keep_idx]

    new_index = faiss.IndexFlatIP(DIM)
    if X_keep.shape[0] > 0:
        new_index.add(X_keep)

    index = new_index
    id_map = ids_keep
    removed = len(tombstones)
    # Dropping metadata for removed ids
    for _id in list(tombstones):
        meta_map.pop(_id, None)
    tombstones.clear()
    return {"compacted": removed, "remaining": int(index.ntotal)}

@app.post("/search")
def search(p: SearchPayload):
    if index.ntotal == 0:
        return []
    
    if len(p.query) != DIM:
        raise HTTPException(
            status_code=422,
            detail=f"Query vector has dim={len(p.query)} but EMBEDDING_DIM={DIM}"
        )

    q = np.asarray(p.query, dtype="float32")
    q = l2_normalize(q).reshape(1, -1)

    # Asking FAISS for extra results to account for tombstoned items we will filter out
    k_cap = min(MAX_TOPK, int(index.ntotal))
    k_raw = int(max(1, min(max(p.top_k * 2, p.top_k + 10), k_cap)))
    D, I = index.search(q, k_raw) # D: scores, I: indices

    out = []
    for score, idx in zip(D[0], I[0]):
        if idx < 0:
            continue
        _id = id_map[int(idx)]
        if _id in tombstones:
            continue
        out.append({
            "id": _id,
            "score": float(score),
            "metadata": meta_map.get(_id, {})
        })
        if len(out) >= p.top_k:
            break
    return out