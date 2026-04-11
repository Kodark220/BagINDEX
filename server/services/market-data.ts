import axios from "axios";

interface DexScreenerPair {
  priceUsd: string;
  volume: { h24: number };
  liquidity: { usd: number };
  fdv: number;
  holders?: number;
}

interface DexScreenerResponse {
  pairs: DexScreenerPair[] | null;
}

export interface MarketData {
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
  holders: number;
}

const DEFAULT_MARKET_DATA: MarketData = {
  priceUsd: 0,
  marketCap: 0,
  volume24h: 0,
  liquidity: 0,
  holders: 0,
};

/**
 * Fetch market data for a Solana token from DexScreener.
 * Falls back to defaults if the token isn't listed.
 */
export async function getMarketData(tokenMint: string): Promise<MarketData> {
  try {
    const { data } = await axios.get<DexScreenerResponse>(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`,
      { timeout: 10000 }
    );

    if (!data.pairs || data.pairs.length === 0) {
      return DEFAULT_MARKET_DATA;
    }

    // Use the pair with highest liquidity
    const pair = data.pairs.sort(
      (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];

    return {
      priceUsd: parseFloat(pair.priceUsd) || 0,
      marketCap: pair.fdv || 0,
      volume24h: pair.volume?.h24 || 0,
      liquidity: pair.liquidity?.usd || 0,
      holders: pair.holders || 0,
    };
  } catch {
    return DEFAULT_MARKET_DATA;
  }
}

/**
 * Batch fetch market data for multiple tokens.
 * DexScreener supports up to 30 addresses in one call.
 */
export async function getBatchMarketData(
  tokenMints: string[]
): Promise<Map<string, MarketData>> {
  const results = new Map<string, MarketData>();

  // Process in batches of 30
  for (let i = 0; i < tokenMints.length; i += 30) {
    const batch = tokenMints.slice(i, i + 30);
    const addresses = batch.join(",");

    try {
      const { data } = await axios.get<DexScreenerResponse>(
        `https://api.dexscreener.com/latest/dex/tokens/${addresses}`,
        { timeout: 15000 }
      );

      if (data.pairs) {
        // Group pairs by base token address, pick highest liquidity pair for each
        const pairsByToken = new Map<string, DexScreenerPair>();
        for (const pair of data.pairs) {
          const baseAddress = (pair as any).baseToken?.address;
          if (!baseAddress) continue;
          const existing = pairsByToken.get(baseAddress);
          if (
            !existing ||
            (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)
          ) {
            pairsByToken.set(baseAddress, pair);
          }
        }

        for (const [mint, pair] of pairsByToken) {
          results.set(mint, {
            priceUsd: parseFloat(pair.priceUsd) || 0,
            marketCap: pair.fdv || 0,
            volume24h: pair.volume?.h24 || 0,
            liquidity: pair.liquidity?.usd || 0,
            holders: pair.holders || 0,
          });
        }
      }
    } catch {
      // Skip failed batches
    }

    // Rate limit pause between batches
    if (i + 30 < tokenMints.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Fill in defaults for missing tokens
  for (const mint of tokenMints) {
    if (!results.has(mint)) {
      results.set(mint, DEFAULT_MARKET_DATA);
    }
  }

  return results;
}
