import express from "express";
import { processVideo } from "./processor";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const API_SECRET = process.env.API_SECRET || "clipblaze-secret";

// Auth middleware
const authenticate = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${API_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Process video endpoint
app.post("/process", authenticate, async (req, res) => {
  const { videoId, youtubeUrl, userId } = req.body;

  if (!videoId || !youtubeUrl || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Start processing in background
  processVideo(videoId, youtubeUrl, userId).catch(console.error);

  res.json({ success: true, message: "Processing started" });
});

app.listen(PORT, () => {
  console.log(`ClipBlaze Worker running on port ${PORT}`);
});
