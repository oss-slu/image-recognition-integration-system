// This file contains helper functions for IndexedDB operations
// We are opening a database, reading a list of saved images and returning them as a promise

export interface StoredImage {
  id: string;
  data: string; // base64
  timestamp: string;
}

// Reusable function to load all stored images from IndexedDB
export function loadStoredImages(): Promise<StoredImage[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ImageStorageDB", 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("images", "readonly");
      const store = transaction.objectStore("images");

      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = (event) => {
        const images = (event.target as IDBRequest).result || [];

        const sorted = images.sort(
          (a: StoredImage, b: StoredImage) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        resolve(sorted);
      };

      getAllRequest.onerror = () =>
        reject(new Error("Error retrieving images from IndexedDB"));
    };

    request.onerror = () => reject(new Error("IndexedDB access failed"));
  });
}

// function to delete an image from IndexedDB
export function deleteImageFromIndexedDB(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ImageStorageDB", 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("images", "readwrite");
      const store = transaction.objectStore("images");
      store.delete(id);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };

    request.onerror = () => reject(request.error);
  });
}

export function clearAllImagesFromIndexedDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ImageStorageDB", 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("images", "readwrite");
      const store = transaction.objectStore("images");
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}
