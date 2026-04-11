// ── Token data from Bags API ──

export interface BagsToken {
  name: string;
  symbol: string;
  description: string;
  image: string;
  tokenMint: string;
  status: "PRE_LAUNCH" | "PRE_GRAD" | "LAUNCHED" | "GRADUATED" | "COMPLETED";
  twitter?: string;
  website?: string;
  launchSignature?: string;
  uri?: string;
  dbcPoolKey?: string;
  dbcConfigKey?: string;
}

export interface TokenCreator {
  username: string;
  pfp: string;
  royaltyBps: number;
  isCreator: boolean;
  wallet: string;
  provider: string;
  providerUsername: string;
  twitterUsername?: string;
  bagsUsername?: string;
  isAdmin: boolean;
  totalClaimed?: string;
}

export interface TokenClaimStats {
  username: string;
  pfp: string;
  royaltyBps: number;
  isCreator: boolean;
  wallet: string;
  totalClaimed: string;
  provider: string;
  providerUsername: string;
  twitterUsername?: string;
  bagsUsername?: string;
  isAdmin: boolean;
}

// ── Enriched token with on-chain + analytics data ──

export interface EnrichedToken {
  // Core Bags data
  name: string;
  symbol: string;
  description: string;
  image: string;
  tokenMint: string;
  status: string;
  twitter?: string;
  website?: string;

  // Creator info
  creators: TokenCreator[];

  // Analytics
  lifetimeFees: number; // in SOL
  totalClaimed: number; // in SOL

  // On-chain / market data
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  liquidity: number;

  // Computed scores
  score: TokenScore;
}

export interface TokenScore {
  overall: number;       // 0-100
  momentum: number;      // 0-100 (volume + price trend)
  health: number;        // 0-100 (holder distribution, liquidity)
  creatorTrust: number;  // 0-100 (creator activity, fee claims)
  community: number;     // 0-100 (holder count, social presence)
}

// ── Index Fund types ──

export type IndexStrategy =
  | "top-momentum"
  | "rising-stars"
  | "blue-chip"
  | "diamond-hands"
  | "high-yield";

export interface IndexFund {
  id: string;
  name: string;
  description: string;
  strategy: IndexStrategy;
  icon: string;
  tokens: IndexAllocation[];
  totalValue: number;
  performance24h: number;
  performance7d: number;
  performance30d: number;
  lastRebalanced: string;
  createdAt: string;
}

export interface IndexAllocation {
  tokenMint: string;
  symbol: string;
  name: string;
  image: string;
  weight: number;        // percentage 0-100
  priceUsd: number;
  change24h: number;
  score: number;
}

// ── Rebalance events ──

export interface RebalanceEvent {
  indexId: string;
  timestamp: string;
  added: { symbol: string; weight: number }[];
  removed: { symbol: string; reason: string }[];
  adjusted: { symbol: string; oldWeight: number; newWeight: number }[];
  aiReasoning: string;
}

// ── API responses ──

export interface BagsApiResponse<T> {
  success: boolean;
  response: T;
  error?: string;
}
