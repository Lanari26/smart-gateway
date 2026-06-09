import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// Lightweight Express host for the SmartPay Gateway frontend. In development it
// proxies through Vite for HMR; in production it serves the built SPA. All
// payment/business logic lives in the backend API (see backend/).
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
