import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApi } from "../hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import ScoreBadge from "./ScoreBadge";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  Layers,
  Target,
  BarChart3,
  Rocket,
  Star,
  Gem,
  HandMetal,
  Coins,
} from "lucide-react";

interface IndexAllocation {
  tokenMint: string;
  symbol: string;
  name: string;
  image: string;
  weight: number;
  priceUsd: number;
  change24h: number;
  score: number;
}

interface IndexFund {
  id: string;
  name: string;
  description: string;
  strategy: string;
  icon: string;
  tokens: IndexAllocation[];
  totalValue: number;
  performance24h: number;
  lastRebalanced: string;
}

const strategyIcons: Record<string, typeof Rocket> = {
  "top-momentum": Rocket,
  "rising-stars": Star,
  "blue-chip": Gem,
  "diamond-hands": HandMetal,
  "high-yield": Coins,
};

const strategyColors: Record<string, string> = {
  "top-momentum": "from-orange-500 to-red-500",
  "rising-stars": "from-yellow-500 to-amber-500",
  "blue-chip": "from-blue-500 to-cyan-500",
  "diamond-hands": "from-purple-500 to-pink-500",
  "high-yield": "from-emerald-500 to-green-500",
};

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(6)}`;
  return "$0.00";
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const row = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export default function IndexDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: fund, loading } = useApi<IndexFund>(`/indexes/${id}`);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 shimmer rounded-lg" />
        <div className="h-48 shimmer rounded-xl" />
        <div className="h-96 shimmer rounded-xl" />
      </div>
    );
  }

  if (!fund) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <p className="text-bags-muted mb-4">Index not found</p>
        <Link to="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </motion.div>
    );
  }

  const Icon = strategyIcons[fund.strategy] || Rocket;
  const gradient = strategyColors[fund.strategy] || "from-bags-primary to-bags-secondary";
  const avgScore =
    fund.tokens.length > 0
      ? Math.round(fund.tokens.reduce((s, t) => s + t.score, 0) / fund.tokens.length)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Back link */}
      <Link to="/">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Indexes
        </Button>
      </Link>

      {/* Index header */}
      <Card className="bg-card-gradient overflow-hidden">
        <div className={`h-1 bg-gradient-to-r ${gradient}`} />
        <CardHeader className="pb-2">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg shrink-0`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl sm:text-3xl font-extrabold">
                {fund.name}
              </CardTitle>
              <p className="text-bags-muted mt-1 leading-relaxed">
                {fund.description}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <MetricBox icon={Target} label="Strategy" value={fund.strategy.replace("-", " ")} />
            <MetricBox icon={Layers} label="Holdings" value={`${fund.tokens.length} tokens`} />
            <MetricBox
              icon={Clock}
              label="Last Rebalanced"
              value={new Date(fund.lastRebalanced).toLocaleTimeString()}
            />
            <div className="bg-bags-dark/50 rounded-xl p-3 border border-bags-border/50">
              <div className="text-[10px] text-bags-muted uppercase tracking-widest mb-1 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" /> Avg Score
              </div>
              <ScoreBadge score={avgScore} size="lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allocations */}
      <Card className="bg-card-gradient overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-bags-primary" />
            Allocations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fund.tokens.length === 0 ? (
            <div className="px-6 py-16 text-center text-bags-muted">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tokens in this index yet.</p>
              <p className="text-xs mt-1">Waiting for data from the agent...</p>
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-6 py-3 text-[10px] text-bags-muted uppercase tracking-widest border-b border-bags-border/50">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Token</div>
                <div className="col-span-3">Weight</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-1 text-right">Score</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              {/* Rows */}
              {fund.tokens.map((token, i) => (
                <motion.div
                  key={token.tokenMint}
                  variants={row}
                  className="grid grid-cols-12 gap-2 items-center px-6 py-3 border-b border-bags-border/30 hover:bg-bags-card-hover/50 transition-colors"
                >
                  <div className="col-span-1 text-bags-muted text-sm font-medium">
                    {i + 1}
                  </div>
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
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
                      <div className="text-white font-semibold text-sm truncate">
                        {token.name}
                      </div>
                      <div className="text-bags-muted text-xs">${token.symbol}</div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(token.weight, 100)}
                        className="flex-1 h-1.5"
                        indicatorClassName={`bg-gradient-to-r ${gradient}`}
                      />
                      <span className="text-white text-xs font-medium w-12 text-right">
                        {token.weight.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-white text-sm">
                    {formatUsd(token.priceUsd)}
                  </div>
                  <div className="col-span-1 text-right">
                    <ScoreBadge score={token.score} size="sm" />
                  </div>
                  <div className="col-span-2 text-right">
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetricBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-bags-dark/50 rounded-xl p-3 border border-bags-border/50">
      <div className="text-[10px] text-bags-muted uppercase tracking-widest mb-1 flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-white font-semibold text-sm capitalize">{value}</div>
    </div>
  );
}
