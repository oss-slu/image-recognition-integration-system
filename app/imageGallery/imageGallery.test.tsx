import { render, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import ImageGallery from "./page"; // Adjust path if needed

// Mock dependencies
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Next.js useSearchParams
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => "1", // Simulate an imageId being present
  }),
}));

// Detailed IndexedDB mock
const createMockIndexedDB = () => {
  const mockOpenRequest: IDBOpenDBRequest = {
    onsuccess: null,
    onerror: null,
    result: {
      transaction: jest.fn().mockReturnValue({
        objectStore: jest.fn().mockReturnValue({
          get: jest.fn().mockReturnValue({
            onsuccess: null as ((event: Event) => void) | null,
            result: {
              id: "1",
              data: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
              timestamp: "2024-03-24T12:00:00Z",
            },
          }),
          getAll: jest.fn().mockReturnValue({
            onsuccess: null as ((event: Event) => void) | null,
            result: [
              {
                id: "1",
                data: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
                timestamp: "2024-03-24T12:00:00Z",
              },
            ],
          }),
        }),
      }),
    },
  } as unknown as IDBOpenDBRequest;

  return {
    open: jest.fn().mockReturnValue(mockOpenRequest),
  };
};

// Global mock for IndexedDB
global.indexedDB = createMockIndexedDB() as unknown as IDBFactory;

describe("ImageGallery Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Configure axios mock to throw an error
    mockedAxios.post.mockRejectedValue(new Error("Network error"));
  });

  test("handles API server not running", async () => {
    // Increase timeout
    jest.setTimeout(10000);

    // Set up console error spy
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    // Render the component
    render(<ImageGallery />);

    // Simulate IndexedDB events
    await act(async () => {
      const mockIndexedDB = global.indexedDB as IDBFactory;
      const openRequest = mockIndexedDB.open("mockDB") as IDBOpenDBRequest;

      openRequest.onsuccess?.({ target: openRequest } as unknown as Event);

      const transaction = openRequest.result.transaction(
        "mockStore",
      ) as IDBTransaction;
      const store = transaction.objectStore("mockStore") as IDBObjectStore;

      const getRequest = store.get("1") as IDBRequest;
      getRequest.onsuccess?.({
        target: {
          result: {
            id: "1",
            data: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
            timestamp: "2024-03-24T12:00:00Z",
          },
        },
      } as unknown as Event);

      const getAllRequest = store.getAll() as IDBRequest;
      getAllRequest.onsuccess?.({ target: getAllRequest } as unknown as Event);
    });

    // Wait for potential state updates
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Clean up
    consoleErrorSpy.mockRestore();
  }, 10000);
});
