import OpenAI from "openai";
import { config } from "../config";
import { BagsToken, TokenCreator, TokenClaimStats, TokenScore, EnrichedToken } from "../types";
import { MarketData } from "./market-data";

// Groq uses the OpenAI-compatible API — free, no credit card needed
const groq = new OpenAI({
  apiKey: config.groqApiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

/**
 * Compute a deterministic base score from raw metrics.
 * The AI layer then adjusts / provides reasoning on top.
 */
function computeBaseScore(
  token: BagsToken,
  market: MarketData,
  lifetimeFees: number,
  creators: TokenCreator[],
  claimStats: TokenClaimStats[]
): TokenScore {
  // ── Momentum (volume + fees) ──
  let momentum = 0;
  if (market.volume24h > 100_000) momentum += 35;
  else if (market.volume24h > 10_000) momentum += 25;
  else if (market.volume24h > 1_000) momentum += 15;
  else if (market.volume24h > 0) momentum += 5;

  if (lifetimeFees > 10) momentum += 30;
  else if (lifetimeFees > 1) momentum += 20;
  else if (lifetimeFees > 0.1) momentum += 10;

  if (market.marketCap > 1_000_000) momentum += 20;
  else if (market.marketCap > 100_000) momentum += 15;
  else if (market.marketCap > 10_000) momentum += 10;

  momentum = Math.min(momentum, 100);

  // ── Health (liquidity + holder distribution) ──
  let health = 0;
  if (market.liquidity > 100_000) health += 40;
  else if (market.liquidity > 10_000) health += 30;
  else if (market.liquidity > 1_000) health += 20;
  else if (market.liquidity > 0) health += 10;

  if (market.holders > 1000) health += 35;
  else if (market.holders > 100) health += 25;
  else if (market.holders > 10) health += 15;
  else if (market.holders > 0) health += 5;

  // Liquidity-to-market-cap ratio (higher = healthier)
  if (market.marketCap > 0) {
    const liqRatio = market.liquidity / market.marketCap;
    if (liqRatio > 0.1) health += 25;
    else if (liqRatio > 0.05) health += 15;
    else if (liqRatio > 0.01) health += 5;
  }

  health = Math.min(health, 100);

  // ── Creator Trust ──
  let creatorTrust = 0;
  const hasCreator = creators.length > 0;
  const primaryCreator = creators.find((c) => c.isCreator);

  if (hasCreator) creatorTrust += 15;
  if (primaryCreator?.twitterUsername) creatorTrust += 20;
  if (primaryCreator?.providerUsername) creatorTrust += 10;
  if (token.twitter) creatorTrust += 10;
  if (token.website) creatorTrust += 10;

  // Fee claiming activity (creators who claim = active/engaged)
  const totalClaimedSol = claimStats.reduce(
    (sum, s) => sum + parseInt(s.totalClaimed || "0", 10) / 1e9,
    0
  );
  if (totalClaimedSol > 1) creatorTrust += 20;
  else if (totalClaimedSol > 0.1) creatorTrust += 10;
  else if (totalClaimedSol > 0) creatorTrust += 5;

  if (token.description && token.description.length > 50) creatorTrust += 15;

  creatorTrust = Math.min(creatorTrust, 100);

  // ── Community ──
  let community = 0;
  if (market.holders > 5000) community += 40;
  else if (market.holders > 1000) community += 30;
  else if (market.holders > 100) community += 20;
  else if (market.holders > 10) community += 10;

  if (token.twitter) community += 20;
  if (token.website) community += 15;
  if (creators.length > 1) community += 15; // multiple fee sharers = active community

  // Volume per holder (high = engaged community)
  if (market.holders > 0 && market.volume24h > 0) {
    const volPerHolder = market.volume24h / market.holders;
    if (volPerHolder > 100) community += 20;
    else if (volPerHolder > 10) community += 10;
  }

  community = Math.min(community, 100);

  // ── Overall ──
  const overall = Math.round(
    momentum * 0.3 + health * 0.25 + creatorTrust * 0.25 + community * 0.2
  );

  return {
    overall: Math.min(overall, 100),
    momentum,
    health,
    creatorTrust,
    community,
  };
}

/**
 * Use AI to provide qualitative analysis and adjust scores.
 * This adds the "intelligence" layer on top of quantitative scores.
 */
async function getAiAnalysis(
  tokens: Array<{
    token: BagsToken;
    market: MarketData;
    score: TokenScore;
    lifetimeFees: number;
  }>
): Promise<Map<string, { adjustedScore: number; reasoning: string }>> {
  const results = new Map<string, { adjustedScore: number; reasoning: string }>();

  if (!config.groqApiKey) {
    // Without AI key, just return base scores
    for (const t of tokens) {
      results.set(t.token.tokenMint, {
        adjustedScore: t.score.overall,
        reasoning: "AI analysis unavailable — using quantitative score only.",
      });
    }
    return results;
  }

  const tokenSummaries = tokens.slice(0, 20).map((t) => ({
    symbol: t.token.symbol,
    mint: t.token.tokenMint,
    name: t.token.name,
    description: t.token.description?.substring(0, 200),
    hasTwitter: !!t.token.twitter,
    hasWebsite: !!t.token.website,
    priceUsd: t.market.priceUsd,
    marketCap: t.market.marketCap,
    volume24h: t.market.volume24h,
    liquidity: t.market.liquidity,
    holders: t.market.holders,
    lifetimeFees: t.lifetimeFees,
    baseScore: t.score.overall,
  }));

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are an AI analyst scoring creator tokens for an index fund on Bags (a Solana creator token platform). 
For each token, provide:
1. An adjusted score (0-100) based on your analysis
2. A one-sentence reasoning

Consider: Is the project legitimate? Does the data suggest organic growth? Is there red-flag behavior?
Respond ONLY with valid JSON: { "analyses": [{ "mint": "...", "adjustedScore": N, "reasoning": "..." }] }`,
        },
        {
          role: "user",
          content: `Analyze these creator tokens:\n${JSON.stringify(tokenSummaries, null, 2)}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content);

    for (const analysis of parsed.analyses || []) {
      results.set(analysis.mint, {
        adjustedScore: Math.min(100, Math.max(0, analysis.adjustedScore)),
        reasoning: analysis.reasoning,
      });
    }
  } catch (err) {
    console.error("AI analysis failed, using base scores:", err);
  }

  // Fill in any missing
  for (const t of tokens) {
    if (!results.has(t.token.tokenMint)) {
      results.set(t.token.tokenMint, {
        adjustedScore: t.score.overall,
        reasoning: "Score based on quantitative metrics.",
      });
    }
  }

  return results;
}

export { computeBaseScore, getAiAnalysis };
