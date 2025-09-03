/* @vitest-environment jsdom */
// tests/CameraButton.test.tsx
// Simple tests for CameraButton - keeping it readable with small comments

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Adjusting import path based on the folder setup
import CameraButton from "../app/components/cameraButton";

// Mock next/navigation 
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// Mock uuid so we know the imageId used in push()
vi.mock("uuid", () => ({ v4: () => "test-uuid-123" }));

// Mock Capacitor camera call
vi.mock("@capacitor/camera", () => ({
    Camera: {
        getPhoto: vi.fn(async () => ({ webPath: "https://example.com/photo.jpg" })),
    },
    CameraResultType: { Uri: "uri" },
}));

// Tiny FileReader stub -> turns a blob into a base64 string
class FileReaderMock {
    result: string | ArrayBuffer | null = null;
    onloadend: null | (() => void) = null;
    readAsDataURL(_blob: Blob) {
        this.result = "data:image/png;base64,AAA";
        if (this.onloadend) this.onloadend();
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
        req.result = fakeDb;
        if (req.onsuccess) req.onsuccess(new Event("success"));
        queueMicrotask(() => {
            if (fakeTx.oncomplete) fakeTx.oncomplete();
        });
    });
    return req;
}
(window as any).indexedDB = {
    open: vi.fn((_name: string, _ver: number) => makeIDBOpenSuccess()),
};

// Fetching is used twice in the component:
// 1. ./setup.json -> returns color class
// 2. photo.webPath -> returns a Blob
const fetchMock = vi.fn(async (url: string) => {
    if (url.includes("setup.json")) {
        return { ok: true, json: async () => ({ cameraButtonColor: "bg-green-600" }) } as any;
    }
    return { ok: true, blob: async () => new Blob(["x"], { type: "image/png" }) } as any;
});
global.fetch = fetchMock as any;

describe("CameraButton", () => {
    afterEach(() => vi.clearAllMocks());
    
    // Renders + Aria
    test("renders the button with accessible name", () => {
        render(<CameraButton />);
        expect(screen.getByRole("button", { name: /use camera/i })).toBeInTheDocument();
    });

    // Theming from setup.json
    test("applies color class from setup.json", async () => {
        render(<CameraButton />);
        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /use camera|capturing/i });
            expect(btn.className).toContain("bg-green-600");
        });
    });

    // Clicking interaction + Full flow (capture -> store -> push)
    test("click starts capture and navigates with imageId", async () => {
        const user = userEvent.setup();
        render(<CameraButton />);

        await user.click(screen.getByRole("button", { name: /use camera/i }));

        // During capture
        expect(screen.getByRole("button", { name: /capturing/i })).toBeDisabled();

        const { useRouter } = await import("next/navigation");
        const router = useRouter();

        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith("/imageGallery?imageId=test-uuid-123");
        });

        // Back to normal
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /use camera/i })).not.toBeDisabled();
        });
    });

    // Disabled state: no double clicks while capturing
    test("ignores extra clicks while capturing", async () => {
        const user = userEvent.setup();
        render(<CameraButton />);
        const first = screen.getByRole("button", { name: /use camera/i });
        await user.dblClick(first); // Double click fast
        // Still should only navigate once
        const { useRouter } = await import("next/navigation");
        const router = useRouter();
        await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
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

