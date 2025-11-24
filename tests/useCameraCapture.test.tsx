import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

// Mocks
jest.mock('../app/utils/indexedDbHelpers', () => ({
  storeImageBlob: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../app/utils/imageOptimization', () => ({
  optimizeImage: jest.fn().mockImplementation(async (buf: Buffer) => {
    // return a slightly smaller buffer
    return Buffer.from([1, 2, 3]);
  }),
  logCompression: jest.fn(),
}));

jest.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: jest.fn(),
  },
  CameraResultType: {
    Uri: 'uri',
  },
}));

import useCameraCapture from '../app/hooks/useCameraCapture';
import { storeImageBlob } from '../app/utils/indexedDbHelpers';
import { Camera } from '@capacitor/camera';

function TestHarness() {
  const { isCapturing, takePhoto } = useCameraCapture();

  return (
    <div>
      <span data-testid="status">{isCapturing ? 'capturing' : 'idle'}</span>
      <button
        onClick={async () => {
          const id = await takePhoto();
          // expose id for assertions
          (window as any).__LAST_IMAGE_ID__ = id;
        }}
      >
        take
      </button>
    </div>
  );
}

describe('useCameraCapture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures, optimizes, stores blob and returns image id', async () => {
    // Prepare Camera.getPhoto mock
    (Camera.getPhoto as jest.Mock).mockResolvedValue({ webPath: 'http://example.com/image.jpg' });

    // Mock fetch to return a blob-like object
    const array = new Uint8Array([10, 20, 30]);
    global.fetch = jest.fn().mockResolvedValue({
      blob: async () => ({
        arrayBuffer: async () => array.buffer,
      }),
    } as any);

    const { getByText, getByTestId } = render(<TestHarness />);

    const btn = getByText('take');

    fireEvent.click(btn);

    await waitFor(() => {
      // ensure storeImageBlob called
      expect(storeImageBlob).toHaveBeenCalledTimes(1);
    });

    // ensure an id was returned and set on window
    await waitFor(() => {
      expect((window as any).__LAST_IMAGE_ID__).toBeTruthy();
    });
  });
});
