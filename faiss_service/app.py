# Small FastAPI app that wraps a FAISS index
# - Stores vectors in memory (ok for local dev)
# - Uses cosine similarity by normalizing vectors and IndexFlatIP
# - Endpoints: /health, /upsert, /delete, /search

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
import faiss

app = FastAPI()

DIM = 384 # Embedding dimension
index = faiss.IndexFlatIP(DIM) # Inner product -> cosine if vectors are L2-normalized
id_map: List[str] = [] # Keeps ids parallel to FAISS rows
meta_map: Dict[str, Dict[str, Any]] = {} # id -> metadata

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
    return {"ok": True, "count": int(index.ntotal), "dim": DIM}

@app.post("/upsert")
def upsert(p: UpsertPayload):
    global index, id_map
    if not p.items:
        return {"added": 0}
    
    # Building matrix of vectors, normalize rows for cosine
    vecs = []
    for it in p.items:
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
    # IndexFlatIP doesn't support in-place deletes -> rebuilds a new index
    global index, id_map
    if not p.ids:
        return {"deleted": 0}

    # Getting all current vectors back
    if index.ntotal == 0:
        return {"deleted": 0}
    
    # Reconstructing all vectors from FAISS
    X = index.reconstruct_n(0, index.ntotal) # (N, DIM) float32
    keep = [i for i, _id in enumerate(id_map) if _id not in set(p.ids)]
    if len(keep) == len(id_map):
        return {"deleted": 0}
    
    X_keep = X[keep]
    ids_keep = [id_map[i] for i in keep]

    # Rebuilding fresh index
    new_index = faiss.IndexFlatIP(DIM)
    if len(X_keep) > 0:
        new_index.add(X_keep.astype("float32"))

    # Swapping in
    index = new_index
    id_map = ids_keep

    # Drop metadata for removed ids
    for _id in p.ids:
        meta_map.pop(_id, None)
    
    return {"deleted": 1}

@app.post("/search")
def search(p: SearchPayload):
    if index.ntotal == 0:
        return []
    
    q = np.asarray(p.query, dtype="float32")
    q = l2_normalize(q).reshape(1, -1)

    k = int(max(1, min(p.top_k, int(index.ntotal))))
    D, I = index.search(q, k) # D: scores, I: indices

    out = []
    for score, idx in zip(D[0], I[0]):
        if idx < 0:
            continue
        _id = id_map[int(idx)]
        out.append({
            "id": _id,
            "score": float(score),
            "metadata": meta_map.get(_id, {})
        })
    return out