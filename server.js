// server.js
import 'dotenv/config';
import express from "express";
import cors from "cors";

const app = express();

// Restricting CORS
app.use((req, res, next) => {
    const key = req.headers["x-api-key"];
    console.log("Received key:", JSON.stringify(key));
    console.log("Expected key:", JSON.stringify(process.env.API_SECRET_KEY));
    if (key !== process.env.API_SECRET_KEY) {
      return res.status(403).json({ error: "Forbidden: Invalid API Key" });
    }
    next();
  });

/// Verifying API Key
app.use((req, res, next) => {
    const key = req.headers["x-api-key"];
    console.log("Received key:", JSON.stringify(key));
    console.log("Expected key:", JSON.stringify(process.env.API_SECRET_KEY));
  
    if (key !== process.env.API_SECRET_KEY) {
      console.log("Key mismatch");
      return res.status(403).json({ error: "Forbidden: Invalid API Key" });
    }
  
    console.log("Key match — proceeding to route");
    next();
  });
  
  // Example backend endpoint
  app.get("/search", (req, res) => {
    console.log("✅ /search route reached — sending response");
    res.json({ success: true, message: "Secure backend route working!" });
  });

  app.listen(5050, () => {
    console.log("Backend running on port 5050");
    console.log("Allowed origin:", process.env.ALLOWED_ORIGIN);
    console.log("API secret key:", process.env.API_SECRET_KEY ? "Loaded" : "Missing ⚠️");
  });