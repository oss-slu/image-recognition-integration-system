/** @jest-environment jsdom */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CameraButton from "../app/components/cameraButton";

// Shared spy so the component and the test see the same push()
const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

// Mock uuid so we know the imageId used in push()
jest.mock("uuid", () => ({ v4: () => "test-uuid-123" }));

// Mock the hook we refactored to
jest.mock("../app/hooks/useCameraCapture", () => ({
  __esModule: true,
  default: jest.fn(),
}));
import useCameraCapture from "../app/hooks/useCameraCapture";

// Silence console.error in this suit
const muteErr = jest.spyOn(console, "error").mockImplementation(() => {});
afterAll(() => muteErr.mockRestore());

// Fetch used for setup.json only in the component
const fetchMock = jest.fn(async (url: string) => {
  if (url.includes("setup.json")) {
    return {
      ok: true,
      json: async () => ({ cameraButtonColor: "bg-green-600" }),
    } as any;
  }
  return { ok: false } as any;
});
global.fetch = fetchMock as any;

describe("CameraButton", () => {
  afterEach(() => jest.clearAllMocks());

  test("renders the button with accessible name", () => {
    (useCameraCapture as jest.Mock).mockReturnValue({
      isCapturing: false,
      takePhoto: jest.fn().mockResolvedValue(null),
    });

    render(<CameraButton />);
    expect(
      screen.getByRole("button", { name: /use camera/i })
    ).toBeInTheDocument();
  });

  test("applies color class from setup.json", async () => {
    (useCameraCapture as jest.Mock).mockReturnValue({
      isCapturing: false,
      takePhoto: jest.fn().mockResolvedValue(null),
    });

    render(<CameraButton />);

    await waitFor(() => {
      const btn = screen.getByRole("button", {
        name: /use camera|capturing\.{3}/i,
      });
      expect(btn.className).toContain("bg-green-600");
    });
  });

  test("click starts capture and navigates with imageId", async () => {
    const user = userEvent.setup();
    const takePhotoMock = jest.fn().mockResolvedValue("test-uuid-123");
    (useCameraCapture as jest.Mock).mockReturnValue({
      isCapturing: false,
      takePhoto: takePhotoMock,
    });

    render(<CameraButton />);

    await user.click(screen.getByRole("button", { name: /use camera/i }));

    await waitFor(() => {
      expect(takePhotoMock).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith("/imageGallery?imageId=test-uuid-123");
    });
  });

  test("ignores extra clicks while capturing", async () => {
    const user = userEvent.setup();
    const takePhotoMock = jest.fn().mockResolvedValue("test-uuid-123");
    // Simulate hook reporting capturing=true so button is disabled
    (useCameraCapture as jest.Mock).mockReturnValue({
      isCapturing: true,
      takePhoto: takePhotoMock,
    });

    render(<CameraButton />);
    const first = screen.getByRole("button", { name: /capturing\.{3}/i });
    await user.dblClick(first); // Double click fast
    // Should not call takePhoto while capturing
    await waitFor(() => expect(takePhotoMock).toHaveBeenCalledTimes(0));
  });

  test("handles missing webPath (takePhoto returns null)", async () => {
    const user = userEvent.setup();
    const takePhotoMock = jest.fn().mockResolvedValue(null);
    (useCameraCapture as jest.Mock).mockReturnValue({
      isCapturing: false,
      takePhoto: takePhotoMock,
    });

    render(<CameraButton />);

    await user.click(screen.getByRole("button", { name: /use camera/i }));

    await waitFor(() => {
      expect(push).not.toHaveBeenCalled();
    });
  });
});
