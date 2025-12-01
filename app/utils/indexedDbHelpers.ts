export const storeImageBlob = (imageId: string, blob: Blob) => {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("ImageStorageDB", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("images", "readwrite");
      const store = transaction.objectStore("images");

      store.put({ id: imageId, data: blob, timestamp: new Date().toISOString() });

      transaction.oncomplete = () => resolve();
      transaction.onerror = (ev) => reject(ev);
    };

    request.onerror = (ev) => reject(ev);
  });
};

export const getImageBlob = (imageId: string): Promise<Blob | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ImageStorageDB", 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("images", "readonly");
      const store = transaction.objectStore("images");
      const getReq = store.get(imageId as string);

      getReq.onsuccess = () => {
        const res = getReq.result;
        if (!res) return resolve(null);
        resolve(res.data as Blob);
      };

      getReq.onerror = (ev) => reject(ev);
    };

    request.onerror = (ev) => reject(ev);
  });
};
// This file contains helper functions for IndexedDB operations
// We are opening a database, reading a list of saved images and returning them as a promise

export interface StoredImage {
  id: string;
  data: string; // base64
  timestamp: string;
}

// Small helper so we don't repeat indexedDB.open everywhere
function openImageDB(): Promise<IDBDatabase> {
return new Promise((resolve, reject) => {
  const request = indexedDB.open("ImageStorageDB", 1);

  // Creating store on first run if needed
  request.onupgradeneeded = () => {
    const db = request.result;
    // If store doesn't exist, creating it with "id" as the primary key
    if (!db.objectStoreNames.contains("images")) {
      db.createObjectStore("images", { keyPath: "id" });
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(new Error("IndexedDB access failed"));
});
}

function hasIndexedDB() {
return typeof window !== "undefined" && "indexedDB" in window;
}

// Reusable function to load all stored images from IndexedDB
export function loadStoredImages(): Promise<StoredImage[]> {
return new Promise(async (resolve, reject) => {
  try {
    if (!hasIndexedDB()) return reject(new Error("IndexedDB not available"));
    const db = await openImageDB();
    const transaction = db.transaction("images", "readonly");
    const store = transaction.objectStore("images");
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = (event) => {
      const images = (event.target as IDBRequest).result || [];

      const sorted = images.sort(
        (a: StoredImage, b: StoredImage) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      resolve(sorted);
    };

    getAllRequest.onerror = () =>
      reject(new Error("Error retrieving images from IndexedDB"));
  } catch (err) {
    reject(err);
  }
});
}

// Getting ONE image by id (returns base64 string or null)
export function getImageFromIndexedDB(id: string): Promise<string | null> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!hasIndexedDB()) return reject(new Error("IndexedDB not available"));
      const db = await openImageDB();
      const tx = db.transaction("images", "readonly");
      const store = tx.objectStore("images");
      const req = store.get(id);

      req.onsuccess = (event) => {
        const record = (event.target as IDBRequest).result as StoredImage | undefined;

        if (!record) {
          console.warn(`No image found for id: ${id}`);
          resolve(null);
          return;
        }

        // If devs stored raw base64 (no data: prefix), normalize to data URL
        const data = record.data || "";
        const dataUrl = data.startsWith("data:")
          ? data
          : `data:image/png;base64,${data}`;

        resolve(dataUrl);
      };

      req.onerror = () => reject(new Error("Failed to read image from IndexedDB"));
    } catch (err) {
      reject(err);
    }
  });
}

// Function to delete an image from IndexedDB
export function deleteImageFromIndexedDB(id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!hasIndexedDB()) return reject(new Error("IndexedDB not available"));
      const db = await openImageDB();
      const transaction = db.transaction("images", "readwrite");
      const store = transaction.objectStore("images");
      store.delete(id);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Clearing everything in the store
export function clearAllImagesFromIndexedDB(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!hasIndexedDB()) return reject(new Error("IndexedDB not available"));
      const db = await openImageDB();
      const transaction = db.transaction("images", "readwrite");
      const store = transaction.objectStore("images");
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    } catch (err) {
      reject(err);
    }
  });
}


