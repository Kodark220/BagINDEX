import { bagsApi, TopTokenEntry } from "./bags-api";
import { getBatchMarketData, MarketData } from "./market-data";
import { computeBaseScore, getAiAnalysis } from "./ai-scorer";
import {
  BagsToken,
  EnrichedToken,
  IndexFund,
  IndexAllocation,
  IndexStrategy,
  RebalanceEvent,
} from "../types";

// ── In-memory store ──
let cachedTokens: EnrichedToken[] = [];
let indexes: IndexFund[] = [];
let rebalanceHistory: RebalanceEvent[] = [];
let lastRefresh: Date | null = null;

// ── Index definitions ──
const INDEX_DEFINITIONS: Array<{
  id: string;
  name: string;
  description: string;
  strategy: IndexStrategy;
  icon: string;
  selectFn: (tokens: EnrichedToken[]) => EnrichedToken[];
}> = [
  {
    id: "top-momentum",
    name: "Momentum Leaders",
    description:
      "Top creator tokens by trading volume, fee revenue, and price momentum. The S&P 500 of Bags.",
    strategy: "top-momentum",
    icon: "🚀",
    selectFn: (tokens) =>
      [...tokens]
        .filter((t) => t.volume24h > 500 && t.score.momentum >= 15)
        .sort((a, b) => b.score.momentum - a.score.momentum || b.volume24h - a.volume24h),
  },
  {
    id: "rising-stars",
    name: "Rising Stars",
    description:
      "Newly launched tokens with high early traction — high scores relative to their age. The growth portfolio.",
    strategy: "rising-stars",
    icon: "⭐",
    selectFn: (tokens) =>
      [...tokens]
        .filter(
          (t) =>
            t.marketCap < 500_000 &&
            t.score.overall >= 15
        )
        .sort((a, b) => b.score.overall - a.score.overall || b.volume24h - a.volume24h),
  },
  {
    id: "blue-chip",
    name: "Blue Chip Creators",
    description:
      "Established creator tokens with the highest market caps, liquidity, and proven creator engagement.",
    strategy: "blue-chip",
    icon: "💎",
    selectFn: (tokens) =>
      [...tokens]
        .filter((t) => t.score.creatorTrust >= 35 && t.marketCap > 0)
        .sort((a, b) => b.marketCap - a.marketCap),
  },
  {
    id: "diamond-hands",
    name: "Diamond Hands",
    description:
      "Tokens with the strongest holder conviction — high holder counts, low sell pressure, organic communities.",
    strategy: "diamond-hands",
    icon: "🤲",
    selectFn: (tokens) =>
      [...tokens]
        .filter((t) => t.score.community >= 10 && (t.holders > 0 || t.score.community >= 20))
        .sort((a, b) => b.score.community - a.score.community || b.holders - a.holders),
  },
  {
    id: "high-yield",
    name: "High Yield",
    description:
      "Tokens generating the most fee revenue. Maximise the 1% creator royalty compounding.",
    strategy: "high-yield",
    icon: "💰",
    selectFn: (tokens) =>
      [...tokens]
        .filter((t) => t.lifetimeFees > 0.01)
        .sort((a, b) => b.lifetimeFees - a.lifetimeFees),
  },
];

/**
 * Build weighted allocations from a set of selected tokens.
 * Weights are score-proportional (higher score = bigger weight).
 */
function buildAllocations(tokens: EnrichedToken[]): IndexAllocation[] {
  if (tokens.length === 0) return [];

  const totalScore = tokens.reduce((s, t) => s + t.score.overall, 0);

  return tokens.map((t) => ({
    tokenMint: t.tokenMint,
    symbol: t.symbol,
    name: t.name,
    image: t.image,
    weight:
      totalScore > 0
        ? Math.round((t.score.overall / totalScore) * 10000) / 100
        : Math.round(10000 / tokens.length) / 100,
    priceUsd: t.priceUsd,
    change24h: 0, // would require historical data
    score: t.score.overall,
  }));
}

/**
 * Refresh all token data from Bags API + market data + AI scoring.
 */
async function refreshTokenData(): Promise<EnrichedToken[]> {
  console.log("🔄 Refreshing token data...");

  // 1. Fetch from both endpoints in parallel (2 API calls total)
  const [topTokens, feedTokens] = await Promise.all([
    bagsApi.getTopTokens().catch((e) => { console.error("   ⚠️ top-tokens failed:", e.message); return [] as TopTokenEntry[]; }),
    bagsApi.getTokenFeed().catch((e) => { console.error("   ⚠️ feed failed:", e.message); return [] as any[]; }),
  ]);

  // If both endpoints failed and we have cached data, keep it
  if (topTokens.length === 0 && feedTokens.length === 0 && cachedTokens.length > 0) {
    console.log(`   ℹ️ Both endpoints rate-limited, keeping ${cachedTokens.length} cached tokens`);
    return cachedTokens;
  }

  // 2. Build enriched tokens from top-tokens (rich data, no extra API calls needed)
  const enrichedMap = new Map<string, EnrichedToken>();

  for (const entry of topTokens) {
    const info = entry.tokenInfo;
    if (!info) continue;

    const vol24h = (info.stats24h?.buyVolume || 0) + (info.stats24h?.sellVolume || 0);
    const lifetimeFees = parseInt(entry.lifetimeFees || "0", 10) / 1e9;
    const totalClaimed = entry.creators?.reduce(
      (sum, c) => sum + parseInt(c.totalClaimed || "0", 10) / 1e9, 0
    ) || 0;

    const creators: import("../types").TokenCreator[] = entry.creators || [];

    const description = (info as any).description || "";

    // Build a pseudo-BagsToken for the scorer
    const pseudoToken = {
      name: info.name,
      symbol: info.symbol,
      description,
      image: info.icon,
      tokenMint: entry.token,
      status: info.graduatedPool ? "GRADUATED" : "PRE_GRAD",
      twitter: info.twitter,
      website: info.website,
    } as any;

    const market: MarketData = {
      priceUsd: info.usdPrice || 0,
      marketCap: info.mcap || 0,
      volume24h: vol24h,
      liquidity: info.liquidity || 0,
      holders: info.holderCount || 0,
    };

    const claimStats = creators.map((c) => ({
      ...c,
      totalClaimed: c.totalClaimed || "0",
    })) as any[];

    const score = computeBaseScore(pseudoToken, market, lifetimeFees, creators, claimStats);

    // Enhance score with rich data only available from top-tokens endpoint
    const stats24h = info.stats24h;
    if (stats24h) {
      // Price momentum bonus
      if (stats24h.priceChange && stats24h.priceChange > 0.1) score.momentum = Math.min(100, score.momentum + 10);
      else if (stats24h.priceChange && stats24h.priceChange > 0.02) score.momentum = Math.min(100, score.momentum + 5);
      // Holder growth bonus
      if (stats24h.holderChange && stats24h.holderChange > 10) score.community = Math.min(100, score.community + 10);
      else if (stats24h.holderChange && stats24h.holderChange > 0) score.community = Math.min(100, score.community + 5);
      // Trader activity bonus
      if (stats24h.numTraders && stats24h.numTraders > 50) score.health = Math.min(100, score.health + 10);
      else if (stats24h.numTraders && stats24h.numTraders > 10) score.health = Math.min(100, score.health + 5);
    }
    // Organic score from Bags API (direct quality signal)
    if (info.organicScore > 70) score.health = Math.min(100, score.health + 10);
    else if (info.organicScore > 40) score.health = Math.min(100, score.health + 5);

    // Recalculate overall with enhanced sub-scores
    score.overall = Math.min(100, Math.round(
      score.momentum * 0.3 + score.health * 0.25 + score.creatorTrust * 0.25 + score.community * 0.2
    ));

    enrichedMap.set(entry.token, {
      name: info.name,
      symbol: info.symbol,
      description,
      image: info.icon,
      tokenMint: entry.token,
      status: info.graduatedPool ? "GRADUATED" : "PRE_GRAD",
      twitter: info.twitter,
      website: info.website,
      creators,
      lifetimeFees,
      totalClaimed,
      priceUsd: info.usdPrice || 0,
      marketCap: info.mcap || 0,
      volume24h: vol24h,
      holders: info.holderCount || 0,
      liquidity: info.liquidity || 0,
      score,
    });
  }

  console.log(`   ✅ Enriched ${enrichedMap.size} tokens from top-tokens (no extra API calls)`);

  // 3. Merge feed tokens that are NOT already in top-tokens
  const feedOnly = feedTokens.filter(
    (t: any) =>
      !enrichedMap.has(t.tokenMint) &&
      (t.status === "PRE_GRAD" || t.status === "LAUNCHED" || t.status === "GRADUATED" || t.status === "COMPLETED")
  );

  if (feedOnly.length > 0) {
    console.log(`   🔍 Enriching ${feedOnly.length} new tokens from feed (DexScreener only, 0 Bags API calls)...`);

    // Batch market data from DexScreener only — no per-token Bags API calls
    const feedMints = feedOnly.map((t: any) => t.tokenMint);
    const marketDataMap = await getBatchMarketData(feedMints);

    for (const token of feedOnly) {
      try {
        const market = marketDataMap.get(token.tokenMint) || {
          priceUsd: 0, marketCap: 0, volume24h: 0, liquidity: 0, holders: 0,
        };

        // Score with DexScreener data only (no Bags fees/creators for feed-only tokens)
        const score = computeBaseScore(token, market, 0, [], []);

        enrichedMap.set(token.tokenMint, {
          name: token.name,
          symbol: token.symbol,
          description: token.description,
          image: token.image,
          tokenMint: token.tokenMint,
          status: token.status,
          twitter: token.twitter,
          website: token.website,
          creators: [],
          lifetimeFees: 0,
          totalClaimed: 0,
          priceUsd: market.priceUsd,
          marketCap: market.marketCap,
          volume24h: market.volume24h,
          holders: market.holders,
          liquidity: market.liquidity,
          score,
        });
      } catch (err) {
        console.error(`   Failed to enrich ${token.symbol}:`, err);
      }
    }
  }

  const enriched = Array.from(enrichedMap.values());

  // 4. Optional AI analysis pass (top 20)
  try {
    const aiResults = await getAiAnalysis(
      enriched.slice(0, 20).map((e) => ({
        token: {
          name: e.name,
          symbol: e.symbol,
          description: e.description,
          image: e.image,
          tokenMint: e.tokenMint,
          status: e.status as any,
          twitter: e.twitter,
          website: e.website,
        },
        market: {
          priceUsd: e.priceUsd,
          marketCap: e.marketCap,
          volume24h: e.volume24h,
          liquidity: e.liquidity,
          holders: e.holders,
        },
        score: e.score,
        lifetimeFees: e.lifetimeFees,
      }))
    );

    for (const e of enriched) {
      const ai = aiResults.get(e.tokenMint);
      if (ai) {
        e.score.overall = ai.adjustedScore;
        e.aiReasoning = ai.reasoning;
      }
    }
  } catch {
    console.log("⚠️ AI scoring skipped");
  }

  // Sort by overall score
  enriched.sort((a, b) => b.score.overall - a.score.overall);

  cachedTokens = enriched;
  lastRefresh = new Date();
  console.log(`✅ Total: ${enriched.length} tokens tracked`);

  return enriched;
}

/**
 * Rebuild all indexes from current token data.
 */
function rebuildIndexes(): IndexFund[] {
  const now = new Date().toISOString();

  indexes = INDEX_DEFINITIONS.map((def) => {
    const selected = def.selectFn(cachedTokens);
    const allocations = buildAllocations(selected);

    const totalValue = allocations.reduce(
      (sum, a) => sum + a.priceUsd * a.weight,
      0
    );

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      strategy: def.strategy,
      icon: def.icon,
      tokens: allocations,
      totalValue,
      performance24h: 0,
      performance7d: 0,
      performance30d: 0,
      lastRebalanced: now,
      createdAt: now,
    };
  });

  console.log(`📋 Built ${indexes.length} indexes`);
  return indexes;
}

/**
 * Full refresh: fetch data → score → build indexes.
 */
async function fullRefresh(): Promise<void> {
  await refreshTokenData();
  rebuildIndexes();
}

// ── Public API ──

export function getIndexes(): IndexFund[] {
  return indexes;
}

export function getIndex(id: string): IndexFund | undefined {
  return indexes.find((i) => i.id === id);
}

export function getTokens(): EnrichedToken[] {
  return cachedTokens;
}

export function getToken(mint: string): EnrichedToken | undefined {
  return cachedTokens.find((t) => t.tokenMint === mint);
}

export function getRebalanceHistory(): RebalanceEvent[] {
  return rebalanceHistory;
}

export function getLastRefresh(): Date | null {
  return lastRefresh;
}

export { fullRefresh, refreshTokenData, rebuildIndexes };
