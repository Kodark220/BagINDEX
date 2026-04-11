import axios, { AxiosInstance } from "axios";
import { config } from "../config";
import {
  BagsApiResponse,
  BagsToken,
  TokenCreator,
  TokenClaimStats,
} from "../types";

// Shape of a token from the top-tokens/lifetime-fees endpoint
export interface TopTokenEntry {
  token: string;
  lifetimeFees: string;
  tokenInfo: {
    id: string;
    name: string;
    symbol: string;
    icon: string;
    decimals: number;
    twitter?: string;
    website?: string;
    dev?: string;
    holderCount: number;
    mcap: number;
    fdv: number;
    usdPrice: number;
    liquidity: number;
    organicScore: number;
    organicScoreLabel: string;
    bondingCurve: number;
    stats24h?: {
      priceChange?: number;
      volumeChange?: number;
      buyVolume?: number;
      sellVolume?: number;
      numBuys?: number;
      numSells?: number;
      numTraders?: number;
      holderChange?: number;
    };
    firstPool?: { id: string; createdAt: string };
    graduatedPool?: string;
    graduatedAt?: string;
    createdAt?: string;
    [key: string]: any;
  };
  creators: TokenCreator[];
  tokenSupply?: any;
  tokenLatestPrice?: {
    price: number;
    priceUSD: number;
    priceSOL: number;
    volumeUSD: number;
  };
}

export class BagsApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.bagsApiBase,
      headers: {
        "x-api-key": config.bagsApiKey,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  /** Retry wrapper for rate-limited requests */
  private async withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 429) {
          const resetTime = err?.response?.data?.resetTime;
          if (resetTime) {
            const waitMs = Math.max(0, new Date(resetTime).getTime() - Date.now()) + 2000;
            // If reset is more than 5 min away, fail immediately — cron will retry naturally
            if (waitMs > 300000) {
              const waitMin = Math.ceil(waitMs / 60000);
              console.log(`   ⏳ [${label}] Rate limited, reset in ${waitMin}m — will retry next cycle`);
              throw new Error(`Rate limited, reset in ${waitMin}m`);
            }
            // Wait for the reset if it's soon
            console.log(`   ⏳ [${label}] Rate limited, waiting ${Math.ceil(waitMs / 1000)}s for reset...`);
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          } else if (attempt < 2) {
            const delay = (attempt + 1) * 10000;
            console.log(`   ⏳ [${label}] Rate limited, waiting ${delay / 1000}s...`);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
        }
        throw err;
      }
    }
    throw new Error(`Failed ${label} after retries`);
  }

  /** Get all tokens with rich data from top-tokens endpoint (173+ tokens) */
  async getTopTokens(): Promise<TopTokenEntry[]> {
    return this.withRetry(async () => {
      const { data } = await this.client.get<BagsApiResponse<TopTokenEntry[]>>(
        "/token-launch/top-tokens/lifetime-fees"
      );
      if (!data.success) throw new Error(data.error || "Failed to fetch top tokens");
      console.log(`   📥 Fetched ${data.response.length} tokens from top-tokens endpoint`);
      return data.response;
    }, "top-tokens");
  }

  /** Get the token launch feed (100 newest tokens, some may not be in top-tokens yet) */
  async getTokenFeed(): Promise<BagsToken[]> {
    return this.withRetry(async () => {
      const { data } = await this.client.get<BagsApiResponse<BagsToken[]>>(
        "/token-launch/feed"
      );
      if (!data.success) throw new Error(data.error || "Failed to fetch token feed");
      console.log(`   📥 Fetched ${data.response.length} tokens from feed endpoint`);
      return data.response;
    }, "feed");
  }

  /** Get lifetime fees for a specific token (returns lamports as string) */
  async getTokenLifetimeFees(tokenMint: string): Promise<number> {
    const { data } = await this.client.get<BagsApiResponse<string>>(
      "/token-launch/lifetime-fees",
      { params: { tokenMint } }
    );
    if (!data.success) throw new Error(data.error || "Failed to fetch lifetime fees");
    return parseInt(data.response, 10) / 1e9;
  }

  /** Get creators of a token */
  async getTokenCreators(tokenMint: string): Promise<TokenCreator[]> {
    const { data } = await this.client.get<BagsApiResponse<TokenCreator[]>>(
      "/token-launch/creator/v3",
      { params: { tokenMint } }
    );
    if (!data.success) throw new Error(data.error || "Failed to fetch creators");
    return data.response;
  }

  /** Get claim stats for a token */
  async getTokenClaimStats(tokenMint: string): Promise<TokenClaimStats[]> {
    const { data } = await this.client.get<BagsApiResponse<TokenClaimStats[]>>(
      "/token-launch/claim-stats",
      { params: { tokenMint } }
    );
    if (!data.success) throw new Error(data.error || "Failed to fetch claim stats");
    return data.response;
  }
}

export const bagsApi = new BagsApiClient();
