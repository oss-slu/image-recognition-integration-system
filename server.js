import express from "express";
import cors from "cors";

const app = express();

// Restricting CORS
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
  })
);

// Verifying API Key
app.use((req, res, next) => {
  const key = req.headers["x-api-key"];
  if (key !== process.env.API_SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden: Invalid API Key" });
  }
  next();
});

// Example backend endpoint
app.get("/search", (req, res) => {
  res.json({ success: true, message: "Secure backend route working!" });
});

app.listen(5000, () => console.log("Backend running on port 5000"));