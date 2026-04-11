import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApi } from "../hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import ScoreBadge from "./ScoreBadge";
import {
  Activity,
  TrendingUp,
  Timer,
  BarChart3,
  ArrowRight,
  Sparkles,
  RefreshCw,
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

interface StatusData {
  tokensTracked: number;
  indexesActive: number;
  lastRefresh: string | null;
  uptime: number;
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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function Dashboard() {
  const { data: indexes, loading: idxLoading } = useApi<IndexFund[]>("/indexes", 30_000);
  const { data: status } = useApi<StatusData>("/status", 15_000);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-bags-primary/10 border border-bags-primary/20">
                <Sparkles className="w-6 h-6 text-bags-primary" />
              </div>
              <Badge variant="outline" className="text-bags-muted">
                Powered by AI
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              Creator Token<br />
              <span className="bg-gradient-to-r from-bags-primary to-bags-accent bg-clip-text text-transparent">
                Index Funds
              </span>
            </h1>
            <p className="text-bags-muted text-lg max-w-xl leading-relaxed">
              AI-powered, auto-rebalancing baskets of the best creator tokens on
              Bags. Diversify across the entire creator economy.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats bar */}
      {status && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={item}>
            <StatCard
              icon={BarChart3}
              label="Tokens Tracked"
              value={status.tokensTracked.toString()}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              icon={Activity}
              label="Active Indexes"
              value={status.indexesActive.toString()}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              icon={RefreshCw}
              label="Last Refresh"
              value={
                status.lastRefresh
                  ? new Date(status.lastRefresh).toLocaleTimeString()
                  : "—"
              }
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              icon={Timer}
              label="Agent Uptime"
              value={`${Math.floor(status.uptime / 60)}m`}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Index cards */}
      {idxLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-bags-border h-72 shimmer" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {indexes?.map((fund) => (
            <motion.div key={fund.id} variants={item}>
              <IndexCard fund={fund} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function IndexCard({ fund }: { fund: IndexFund }) {
  const Icon = strategyIcons[fund.strategy] || Rocket;
  const gradient = strategyColors[fund.strategy] || "from-bags-primary to-bags-secondary";
  const avgScore =
    fund.tokens.length > 0
      ? Math.round(fund.tokens.reduce((s, t) => s + t.score, 0) / fund.tokens.length)
      : 0;

  return (
    <Link to={`/index/${fund.id}`} className="block group">
      <Card className="h-full card-glow bg-card-gradient hover:bg-bags-card-hover transition-all duration-300 group-hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs tabular-nums">
                {fund.tokens.length} tokens
              </Badge>
              <ScoreBadge score={avgScore} size="sm" />
            </div>
          </div>
          <CardTitle className="text-lg mt-3">{fund.name}</CardTitle>
          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
            {fund.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token avatars */}
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {fund.tokens.slice(0, 5).map((t) => (
                <div
                  key={t.tokenMint}
                  className="w-8 h-8 rounded-full bg-bags-border overflow-hidden border-2 border-bags-card ring-1 ring-bags-border/50"
                  title={t.symbol}
                >
                  {t.image ? (
                    <img src={t.image} alt={t.symbol} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-bags-muted bg-bags-dark">
                      {t.symbol.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {fund.tokens.length > 5 && (
              <span className="text-xs text-bags-muted ml-2">
                +{fund.tokens.length - 5} more
              </span>
            )}
            {fund.tokens.length === 0 && (
              <span className="text-xs text-bags-muted">Awaiting data...</span>
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between pt-2 border-t border-bags-border/50">
            <div>
              <div className="text-[10px] text-bags-muted uppercase tracking-widest mb-0.5">
                Holdings
              </div>
              <div className="text-white font-semibold text-sm">
                {fund.tokens.length} tokens
              </div>
            </div>
            <div className="flex items-center gap-1 text-bags-muted group-hover:text-bags-primary transition-colors text-sm">
              View
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <Card className="bg-card-gradient">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-bags-primary/10 border border-bags-primary/20 shrink-0">
          <Icon className="w-4 h-4 text-bags-primary" />
        </div>
        <div>
          <div className="text-[10px] text-bags-muted uppercase tracking-widest">
            {label}
          </div>
          <div className="text-lg font-bold text-white">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
