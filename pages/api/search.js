// pages/api/search.js
export default async function handler(req, res) {
    const { query } = req.query;
  
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter" });
    }
  
    try {
      const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/search?query=${encodeURIComponent(query)}`;
  
      const response = await fetch(backendUrl, {
        headers: {
          "x-api-key": process.env.API_SECRET_KEY,
        },
      });
  
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }