import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { generate } from "./chatbot.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins array
const allowedOrigins = [
    process.env.CLIENT_ORIGIN,
    "http://localhost:3000",
    "https://yourdomain.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(bodyParser.json());

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// POST /generate endpoint
app.post("/api/generate", async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }
  if(message.length > 15 && message.split(" ").length === 1) {
    const message = "It seems like you may have accidentally typed a string of random characters. Could you please rephrase or provide a clear question or topic you'd like to discuss?"
    return res.json({ message, id: Date.now(), role: "assistant", extra_msg: "Random input"  })
  }
  try {
    const response = await generate(message);
    res.json({ message: response, id: Date.now(), role: "assistant" });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate response" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});