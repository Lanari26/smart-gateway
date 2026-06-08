import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Google GenAI SDK client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // API Route: AI Developer Assistant and API Payload Generation
  app.post("/api/ai/sandbox", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (!ai) {
        return res.status(503).json({ 
          error: "Gemini API Client is not initialized. Please verify that your GEMINI_API_KEY environment variable is configured in the Secrets pane." 
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "You are an elite, helpful AI Assistant integrated directly into the 'SmartPay Gateway' Developer Dashboard. You assist merchants and developers in designing perfect REST API commands, debugging payloads, creating test webhooks, and understanding payment standards (such as ISO 8583, card format compliance, and sandbox token configurations). Keep your code samples elegant, using curl and typescript.",
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Assistant Sandbox Error:", error);
      res.status(500).json({ error: error?.message || "An error occurred with the AI model request. Please retry." });
    }
  });

  // Vite middleware integration for dynamic hot reloading in development, or static serving in production
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with dynamic Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with compiled static asset delivery...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartPay Gateway Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start SmartPay Gateway Server:", err);
});
