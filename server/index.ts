import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config";
import apiRoutes from "./routes/api";
import { startRebalancer } from "./services/rebalancer";

// Prevent crash on unhandled errors
process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught exception:", err);
});

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api", apiRoutes);

// Serve frontend in production
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║         🎒 BagsIndex Agent          ║
  ║   AI-Powered Creator Index Funds    ║
  ╠══════════════════════════════════════╣
  ║  Server:  http://localhost:${config.port}     ║
  ║  API:     http://localhost:${config.port}/api ║
  ╚══════════════════════════════════════╝
  `);

  // Start the autonomous rebalancing agent
  startRebalancer();
});
