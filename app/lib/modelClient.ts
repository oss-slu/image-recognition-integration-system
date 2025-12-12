export class ModelClient {
    private apiUrl: string;
    private token: string | null = null;
  
    constructor(apiUrl: string) {
      this.apiUrl = apiUrl;
      
      // Get token from localStorage
      if (typeof window !== 'undefined') {
        this.token = localStorage.getItem('iris_token');
      }
    }
  
    async searchImage(imageData: string) {
      const response = await fetch(`${this.apiUrl}/api/image-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ image: imageData }),
      });
  
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('iris_token');
        localStorage.removeItem('iris_user');
        window.location.href = '/loginscreen';
        throw new Error('Authentication required');
      }
  
      if (!response.ok) {
        throw new Error('Search failed');
      }
  
      return response.json();
    }
  }