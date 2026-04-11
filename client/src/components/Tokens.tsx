import { motion } from "framer-motion";
import { useApi } from "../hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import ScoreBadge from "./ScoreBadge";
import {
  Coins,
  ExternalLink,
  TrendingUp,
  Heart,
  Shield,
  Users,
  Search,
  Layers,
} from "lucide-react";
import { useState } from "react";

interface TokenScore {
  overall: number;
  momentum: number;
  health: number;
  creatorTrust: number;
  community: number;
}

interface EnrichedToken {
  name: string;
  symbol: string;
  description: string;
  image: string;
  tokenMint: string;
  twitter?: string;
  website?: string;
  lifetimeFees: number;
  totalClaimed: number;
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  liquidity: number;
  score: TokenScore;
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(6)}`;
  return "$0.00";
}

function formatSol(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K SOL`;
  if (n >= 1) return `${n.toFixed(2)} SOL`;
  if (n > 0) return `${n.toFixed(4)} SOL`;
  return "0 SOL";
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const row = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const dimensionMeta: { key: keyof TokenScore; label: string; short: string; color: string; icon: typeof TrendingUp }[] = [
  { key: "momentum", label: "Momentum", short: "M", color: "from-orange-500 to-red-500", icon: TrendingUp },
  { key: "health", label: "Health", short: "H", color: "from-emerald-500 to-green-500", icon: Heart },
  { key: "creatorTrust", label: "Trust", short: "T", color: "from-blue-500 to-cyan-500", icon: Shield },
  { key: "community", label: "Community", short: "C", color: "from-purple-500 to-pink-500", icon: Users },
];

export default function Tokens() {
  const { data: tokens, loading } = useApi<EnrichedToken[]>("/tokens?sort=score");
  const { data: status } = useApi<{ tokensTracked: number; indexesActive: number; lastRefresh: string | null; uptime: number }>("/status", 15_000);
  const [search, setSearch] = useState("");

  const filtered =
    tokens?.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.symbol.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Page header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-extrabold text-white mb-2"
        >
          All Creator Tokens
          {status && (
            <Badge variant="outline" className="ml-3 text-sm font-normal align-middle tabular-nums">
              {status.tokensTracked} tracked
            </Badge>
          )}
        </motion.h1>
        <p className="text-bags-muted leading-relaxed max-w-2xl">
          Every token on Bags, scored and ranked by our AI agent. Click any token to trade on Bags.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bags-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tokens..."
          className="w-full bg-bags-dark/50 border border-bags-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-bags-muted focus:outline-none focus:ring-2 focus:ring-bags-primary/50 focus:border-bags-primary/50 transition-all"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 shimmer rounded-xl" />
          ))}
        </div>
      ) : !tokens || tokens.length === 0 ? (
        <Card className="bg-card-gradient">
          <CardContent className="px-6 py-16 text-center">
            <Layers className="w-12 h-12 mx-auto mb-4 text-bags-muted opacity-30" />
            <p className="text-bags-muted text-lg mb-2 font-medium">No tokens loaded yet</p>
            <p className="text-bags-muted text-sm">
              The agent is fetching data from Bags. This can take a minute on first startup.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card-gradient overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-bags-primary" />
              <span className="tabular-nums">
                {search
                  ? `${filtered.length} of ${tokens?.length ?? 0}`
                  : `${tokens?.length ?? 0}`}
              </span>
              Token{(tokens?.length ?? 0) !== 1 ? "s" : ""}
              {search && (
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  filtered
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="overflow-x-auto">
              {/* Header */}
              <div className="grid grid-cols-[40px_minmax(140px,1.5fr)_100px_100px_100px_100px_80px_100px_70px_140px_70px] gap-1 px-6 py-3 text-[10px] text-bags-muted uppercase tracking-widest border-b border-bags-border/50 min-w-[1100px]">
                <div>#</div>
                <div>Token</div>
                <div className="text-right">Price</div>
                <div className="text-right">MCap</div>
                <div className="text-right">24h Vol</div>
                <div className="text-right">Liquidity</div>
                <div className="text-right">Holders</div>
                <div className="text-right">Fees</div>
                <div className="text-center">Score</div>
                <div className="text-center">Breakdown</div>
                <div />
              </div>

              {/* Rows */}
              <motion.div variants={container} initial="hidden" animate="show" className="min-w-[1100px]">
                {filtered.map((token, i) => (
                  <motion.div
                    key={token.tokenMint}
                    variants={row}
                    className="grid grid-cols-[40px_minmax(140px,1.5fr)_100px_100px_100px_100px_80px_100px_70px_140px_70px] gap-1 items-center px-6 py-3 border-b border-bags-border/30 hover:bg-bags-card-hover/50 transition-colors"
                  >
                    {/* Rank */}
                    <div className="text-bags-muted text-sm font-medium">{i + 1}</div>

                    {/* Token info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-bags-border overflow-hidden shrink-0 ring-1 ring-bags-border/50">
                        {token.image ? (
                          <img src={token.image} alt={token.symbol} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-bags-muted bg-bags-dark">
                            {token.symbol.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-semibold text-sm truncate">{token.name}</div>
                        <div className="text-bags-muted text-xs">${token.symbol}</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right text-white text-sm">{formatUsd(token.priceUsd)}</div>

                    {/* Market Cap */}
                    <div className="text-right text-white text-sm">{formatUsd(token.marketCap)}</div>

                    {/* Volume */}
                    <div className="text-right text-white text-sm">{formatUsd(token.volume24h)}</div>

                    {/* Liquidity */}
                    <div className="text-right text-white text-sm">{formatUsd(token.liquidity)}</div>

                    {/* Holders */}
                    <div className="text-right text-white text-sm">{token.holders.toLocaleString()}</div>

                    {/* Fees */}
                    <div className="text-right text-white text-sm">{formatSol(token.lifetimeFees)}</div>

                    {/* Score */}
                    <div className="text-center">
                      <ScoreBadge score={token.score.overall} size="sm" />
                    </div>

                    {/* Score breakdown */}
                    <div className="flex items-center gap-1 justify-center">
                      {dimensionMeta.map((dim) => (
                        <MiniScore key={dim.key} dim={dim} value={token.score[dim.key] as number} />
                      ))}
                    </div>

                    {/* Trade link */}
                    <div className="text-right">
                      <a
                        href={`https://bags.fm/${token.tokenMint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                          Trade
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function MiniScore({
  dim,
  value,
}: {
  dim: (typeof dimensionMeta)[number];
  value: number;
}) {
  const color =
    value >= 70
      ? "text-bags-green"
      : value >= 40
      ? "text-bags-yellow"
      : "text-bags-red";

  return (
    <div className="text-center group relative" title={`${dim.label}: ${value}`}>
      <div className={`text-xs font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-bags-muted">{dim.short}</div>
    </div>
  );
}
