// app/services/rerumClient.ts
const BASE_URL = "http://localhost:4000"; // TinyNode gateway

export async function createAnnotation(data:object) {
  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`RERUM Create failed with status ${res.status}`);
  }

  return res.json();
}

export async function getAnnotation(id: string) {
  const res = await fetch(`${BASE_URL}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ "@id": id }),
  });

  if (!res.ok) {
    throw new Error(`RERUM Get failed with status ${res.status}`);
  }

  return res.json();
}

export async function updateAnnotation(data: object) {
  const res = await fetch(`${BASE_URL}/overwrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`RERUM Update failed with status ${res.status}`);
  }

  return res.json();
}

export async function deleteAnnotation(id: string) {
  const res = await fetch(`${BASE_URL}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ "@id": id }),
  });

  if (!res.ok) {
    throw new Error(`RERUM Delete failed with status ${res.status}`);
  }

  return res.json();
}
