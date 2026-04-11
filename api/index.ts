import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import apiRoutes from "../server/routes/api";
import {
  fullRefresh,
  getTokens,
  getLastRefresh,
} from "../server/services/index-manager";

const app = express();

app.use(cors());
app.use(express.json());

// ── Lazy initialization for Vercel serverless ──
// On cold start the in-memory cache is empty. This middleware ensures data is
// fetched before the first response. On warm instances with stale data (>5 min)
// it kicks off a background refresh but returns the stale data immediately.
let refreshing: Promise<void> | null = null;

app.use(async (_req, _res, next) => {
  try {
    const lastRefresh = getLastRefresh();
    const stale =
      !lastRefresh ||
      Date.now() - lastRefresh.getTime() > 5 * 60 * 1000;
    const empty = getTokens().length === 0;

    if ((empty || stale) && !refreshing) {
      console.log(
        empty
          ? "🔄 Cold start — fetching data..."
          : "🔄 Data stale — refreshing in background..."
      );
      refreshing = fullRefresh()
        .catch((err: any) => console.error("Refresh failed:", err))
        .finally(() => {
          refreshing = null;
        });
    }

    // Block only on cold start (empty cache); stale data is returned immediately
    if (empty && refreshing) {
      await refreshing;
    }
  } catch (err) {
    console.error("Init middleware error:", err);
  }
  next();
});

// Mount all API routes
app.use("/api", apiRoutes);

export default app;
