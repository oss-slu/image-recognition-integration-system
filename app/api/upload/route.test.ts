import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { POST } from './route'; // Adjust the path as needed

// Mock Next.js components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn().mockImplementation((body, options) => {
      return {
        status: options?.status || 200,
        json: async () => body
      };
    })
  }
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Image Search API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return similar images when provided with a valid image', async () => {
    // Mock the API response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        similar_images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg']
      }
    });

    // Create a mock request
    const mockRequest = {
      json: jest.fn().mockResolvedValueOnce({
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      })
    } as unknown as NextRequest;

    // Call the API route handler
    const response = await POST(mockRequest);
    const responseData = await response.json();

    // Check the response
    expect(response.status).toBe(200);
    expect(responseData).toEqual({
      similar_images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg']
    });
    
    // Verify that axios was called with the correct parameters
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('api.shniter.com:5000/search'),
      { image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
    );
  });

  // Additional tests can be updated similarly
});