import { Router, Request, Response } from "express";
import {
  getIndexes,
  getIndex,
  getTokens,
  getToken,
  getRebalanceHistory,
  getLastRefresh,
  fullRefresh,
} from "../services/index-manager";
import { launchBagsIndexToken } from "../services/token-launcher";

const router = Router();

// ── Index endpoints ──

/** GET /api/indexes — List all index funds */
router.get("/indexes", (_req: Request, res: Response) => {
  const data = getIndexes();
  res.json({ success: true, data });
});

/** GET /api/indexes/:id — Get a specific index fund */
router.get("/indexes/:id", (req: Request, res: Response) => {
  const fund = getIndex(req.params.id);
  if (!fund) {
    res.status(404).json({ success: false, error: "Index not found" });
    return;
  }
  res.json({ success: true, data: fund });
});

// ── Token endpoints ──

/** GET /api/tokens — List all scored tokens */
router.get("/tokens", (req: Request, res: Response) => {
  let tokens = getTokens();

  // Optional sorting
  const sort = req.query.sort as string;
  if (sort === "score") tokens = [...tokens].sort((a, b) => b.score.overall - a.score.overall);
  if (sort === "volume") tokens = [...tokens].sort((a, b) => b.volume24h - a.volume24h);
  if (sort === "marketcap") tokens = [...tokens].sort((a, b) => b.marketCap - a.marketCap);
  if (sort === "fees") tokens = [...tokens].sort((a, b) => b.lifetimeFees - a.lifetimeFees);

  // Optional limit
  const limit = parseInt(req.query.limit as string, 10);
  if (limit > 0) tokens = tokens.slice(0, limit);

  res.json({ success: true, data: tokens, total: getTokens().length });
});

/** GET /api/tokens/:mint — Get a specific token with full analysis */
router.get("/tokens/:mint", (req: Request, res: Response) => {
  const token = getToken(req.params.mint);
  if (!token) {
    res.status(404).json({ success: false, error: "Token not found" });
    return;
  }
  res.json({ success: true, data: token });
});

// ── Rebalance endpoints ──

/** GET /api/rebalance/history — Rebalance event history */
router.get("/rebalance/history", (_req: Request, res: Response) => {
  res.json({ success: true, data: getRebalanceHistory() });
});

/** POST /api/rebalance/trigger — Manually trigger a rebalance */
router.post("/rebalance/trigger", async (_req: Request, res: Response) => {
  try {
    await fullRefresh();
    res.json({ success: true, message: "Rebalance complete" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Status ──

/** GET /api/status — Agent status */
router.get("/status", (_req: Request, res: Response) => {
  const last = getLastRefresh();
  res.json({
    success: true,
    data: {
      tokensTracked: getTokens().length,
      indexesActive: getIndexes().length,
      lastRefresh: last?.toISOString() || null,
      uptime: process.uptime(),
    },
  });
});

// ── Vercel Cron ──

/** GET /api/cron/rebalance — Endpoint for Vercel Cron Jobs */
router.get("/cron/rebalance", async (_req: Request, res: Response) => {
  try {
    await fullRefresh();
    res.json({ success: true, message: "Cron rebalance complete" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Token Launch ──

/** POST /api/launch — Launch the BagsIndex token on Bags */
router.post("/launch", async (req: Request, res: Response) => {
  try {
    const { imageUrl, name, symbol, description, twitterUrl, websiteUrl, initialBuyLamports } = req.body;
    if (!imageUrl) {
      res.status(400).json({ success: false, error: "imageUrl is required" });
      return;
    }
    const result = await launchBagsIndexToken({
      imageUrl,
      name,
      symbol,
      description,
      twitterUrl,
      websiteUrl,
      initialBuyLamports,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
