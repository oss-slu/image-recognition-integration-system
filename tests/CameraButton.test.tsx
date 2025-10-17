/** @jest-environment jsdom */
// tests/CameraButton.test.tsx
// Simple test for CameraButton - keeping it readable with small comments

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.setTimeout(10000);

// Adjusting import path based on the folder setup
import CameraButton from "../app/components/cameraButton";
import { wait } from "@testing-library/user-event/dist/cjs/utils/index.js";

// Shared spy so the component and the test see the same push()
const push = jest.fn();
jest.mock("next/navigation", () => ({
    useRouter: () => ({ push }),
}));

// Mock uuid so we know the imageId used in push()
jest.mock("uuid", () => ({ v4: () => "test-uuid-123" }));

// Mock Capacitor camera call
jest.mock("@capacitor/camera", () => ({
    Camera: {
        getPhoto: jest.fn(
            async () => 
                new Promise((resolve) =>
                    setTimeout(() => resolve({ webPath: "https://example.com/photo.jpg" }), 20)
                )
        ),
    },
    CameraResultType: { Uri: "uri" },
}));

// Tiny FileReader stub -> turns a blob into a base64 string
class FileReaderMock {
    result: string | ArrayBuffer | null = null;
    onloadend: null | (() => void) = null;
    readAsDataURL(_blob: Blob) {
        this.result = "data:image/png;base64,AAA";
        // Fire on the next tick so onloadened can be assigned first
        setTimeout(() => {
            if (this.onloadend) this.onloadend();
        }, 0);
    }
}
Object.defineProperty(window, "FileReader", { value: FileReaderMock });

// Super small IndexedDB mock (just enough for .open -> transaction -> put)
const fakeTx = {
    objectStore: () => ({ put: (_v: any) => void 0 }),
    oncomplete: null as null | (() => void),
    onerror: null as null | (() => void),
};
const fakeDb = {
    transaction: () => fakeTx,
    objectStoreNames: { contains: () => false },
    createObjectStore: (_: string, __: any) => void 0,
};
function makeIDBOpenSuccess() {
    const req: any = {};
    queueMicrotask(() => {
        // Mock DB returned on success
        const db = {
            // Creating a tx that calls oncomplete AFTER the handler is set
            transaction: (_store: string, _mode: string) => {
                const tx: any = {};
                tx.objectStore = () => ({ put: (_v: any) => void 0 });

                // Fire after the current synchronous code completes
                queueMicrotask(() => {
                    if (typeof tx.oncomplete === "function") tx.oncomplete();
                });

                return tx;
            },
            objectStoreNames: { contains: () => true },
            createObjectStore: (_: string, __: any) => void 0,
        };

        // If code listens for upgrade, calling it first
        if (typeof req.onupgradeneeded === "function") {
            req.result = db;
            req.onupgradeneeded({} as any);
        }

        // Then signal success with the deb
        req.result = db;
        if (typeof req.onsuccess === "function") {
            req.onsuccess(new Event("success"));
        }
    });
    return req;
}
(window as any).indexedDB = {
    open: jest.fn((_name: string, _ver: number) => makeIDBOpenSuccess()),
};

// Silence console.error in this suit
const muteErr = jest.spyOn(console, "error").mockImplementation(() => {});
afterAll(() => muteErr.mockRestore());

// Fetching is used twice in the component:
// 1. ./setup.json -> returns color class
// 2. photo.webPath -> returns a Blob
const fetchMock = jest.fn(async (url: string) => {
    if (url.includes("setup.json")) {
        return { ok: true, json: async () => ({ cameraButtonColor: "bg-green-600" }) } as any;
    }
    return { ok: true, blob: async () => new Blob(["x"], { type: "image/png" }) } as any;
});
global.fetch = fetchMock as any;

describe("CameraButton", () => {
    afterEach(() => jest.clearAllMocks());
    
    // Renders + Aria
    test("renders the button with accessible name", () => {
        render(<CameraButton />);
        expect(screen.getByRole("button", { name: /use camera/i })).toBeInTheDocument();
    });

    // Theming from setup.json
    test("applies color class from setup.json", async () => {
        render(<CameraButton />);
        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /use camera|capturing\.\.\./i });
            expect(btn.className).toContain("bg-green-600");
        });
    });

    // Clicking interaction + Full flow (capture -> store -> push)
    test("click starts capture and navigates with imageId", async () => {
        const user = userEvent.setup();
        render(<CameraButton />);

        await user.click(screen.getByRole("button", { name: /use camera/i }));
        
        // ✅ Wait manually for React to render the disabled state
        await new Promise((r) => setTimeout(r, 50));

        const btn = screen.getByRole("button", { name: /use camera/i });
        expect(btn).toBeDisabled();

        await waitFor(() => {
            expect(push).toHaveBeenCalledWith("/imageGallery?imageId=test-uuid-123");
        });

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /use camera/i })).not.toBeDisabled();
        });
    });

    // Disabled state: no double clicks while capturing
    test("ignores extra clicks while capturing", async () => {
        const user = userEvent.setup();
        render(<CameraButton />);
        const btn = screen.getByRole("button", { name: /use camera/i });
        
        await user.click(btn);
        // Giving React a tick to set isCapturing=true
        await new Promise((r) => setTimeout(r, 10));
        await user.click(btn);

        await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    });

    // Guard: If camera returns no webPath, it should not crash
    test("handles missing webPath", async () => {
        const { Camera } = await import("@capacitor/camera");
        (Camera.getPhoto as any).mockResolvedValueOnce({webPath: null });

        const user = userEvent.setup();
        render(<CameraButton />);

        await user.click(screen.getByRole("button", { name: /use camera/i }));

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /use camera/i })).not.toBeDisabled();
        });
    });
});

