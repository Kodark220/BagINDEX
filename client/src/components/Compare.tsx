import { useState } from "react";
import { motion } from "framer-motion";
import { useApi } from "../hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import ScoreBadge from "./ScoreBadge";
import {
  ArrowLeftRight,
  Layers,
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

export default function Compare() {
  const { data: indexes, loading } = useApi<IndexFund[]>("/indexes", 30_000);
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  const left = indexes?.find((i) => i.id === leftId);
  const right = indexes?.find((i) => i.id === rightId);

  // Compute overlap
  const leftMints = new Set(left?.tokens.map((t) => t.tokenMint) || []);
  const rightMints = new Set(right?.tokens.map((t) => t.tokenMint) || []);
  const overlap = left && right ? [...leftMints].filter((m) => rightMints.has(m)) : [];
  const leftOnly = left ? left.tokens.filter((t) => !rightMints.has(t.tokenMint)) : [];
  const rightOnly = right ? right.tokens.filter((t) => !leftMints.has(t.tokenMint)) : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 shimmer rounded-lg" />
        <div className="h-64 shimmer rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
          <ArrowLeftRight className="w-8 h-8 text-bags-primary" />
          Compare Indexes
        </h1>
        <p className="text-bags-muted max-w-2xl">
          Compare two indexes side by side to see token overlap and unique holdings.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectBox
          label="Left Index"
          indexes={indexes || []}
          value={leftId}
          onChange={setLeftId}
          exclude={rightId}
        />
        <SelectBox
          label="Right Index"
          indexes={indexes || []}
          value={rightId}
          onChange={setRightId}
          exclude={leftId}
        />
      </div>

      {/* Comparison */}
      {left && right && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <SummaryCard
              label={left.name}
              count={leftOnly.length}
              subtitle="unique tokens"
              color={strategyColors[left.strategy]}
              icon={strategyIcons[left.strategy]}
            />
            <SummaryCard
              label="Overlap"
              count={overlap.length}
              subtitle="shared tokens"
              color="from-bags-primary to-bags-accent"
              icon={ArrowLeftRight}
            />
            <SummaryCard
              label={right.name}
              count={rightOnly.length}
              subtitle="unique tokens"
              color={strategyColors[right.strategy]}
              icon={strategyIcons[right.strategy]}
            />
          </div>

          {/* Overlap tokens */}
          {overlap.length > 0 && (
            <Card className="bg-card-gradient">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-bags-primary" />
                  Shared Tokens ({overlap.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {overlap.map((mint) => {
                    const t = left.tokens.find((x) => x.tokenMint === mint)!;
                    return (
                      <div
                        key={mint}
                        className="flex items-center gap-2 bg-bags-dark/50 border border-bags-border/50 rounded-lg px-3 py-2"
                      >
                        <div className="w-6 h-6 rounded-full bg-bags-border overflow-hidden shrink-0">
                          {t.image ? (
                            <img src={t.image} alt={t.symbol} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-bags-muted bg-bags-dark">
                              {t.symbol.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-white font-medium">{t.symbol}</span>
                        <ScoreBadge score={t.score} size="sm" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Side by side unique tokens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UniqueList
              title={`Only in ${left.name}`}
              tokens={leftOnly}
              color={strategyColors[left.strategy]}
            />
            <UniqueList
              title={`Only in ${right.name}`}
              tokens={rightOnly}
              color={strategyColors[right.strategy]}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function SelectBox({
  label,
  indexes,
  value,
  onChange,
  exclude,
}: {
  label: string;
  indexes: IndexFund[];
  value: string;
  onChange: (v: string) => void;
  exclude: string;
}) {
  return (
    <div>
      <label className="text-xs text-bags-muted uppercase tracking-widest mb-2 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bags-dark border border-bags-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-bags-primary/50"
      >
        <option value="">Select an index...</option>
        {indexes
          .filter((i) => i.id !== exclude)
          .map((i) => (
            <option key={i.id} value={i.id}>
              {i.icon} {i.name} ({i.tokens.length} tokens)
            </option>
          ))}
      </select>
    </div>
  );
}

function SummaryCard({
  label,
  count,
  subtitle,
  color,
  icon: Icon,
}: {
  label: string;
  count: number;
  subtitle: string;
  color: string;
  icon: typeof Rocket;
}) {
  return (
    <Card className="bg-card-gradient">
      <CardContent className="p-4 text-center">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} mx-auto mb-2 flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-2xl font-bold text-white">{count}</div>
        <div className="text-xs text-bags-muted">{subtitle}</div>
        <div className="text-xs text-bags-text mt-1 truncate">{label}</div>
      </CardContent>
    </Card>
  );
}

function UniqueList({
  title,
  tokens,
  color,
}: {
  title: string;
  tokens: IndexAllocation[];
  color: string;
}) {
  return (
    <Card className="bg-card-gradient">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {tokens.length === 0 ? (
          <p className="text-sm text-bags-muted py-4 text-center">All tokens are shared</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tokens.map((t) => (
              <div
                key={t.tokenMint}
                className="flex items-center gap-2 text-sm py-1"
              >
                <div className="w-6 h-6 rounded-full bg-bags-border overflow-hidden shrink-0">
                  {t.image ? (
                    <img src={t.image} alt={t.symbol} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-bags-muted bg-bags-dark">
                      {t.symbol.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-white font-medium flex-1 truncate">{t.symbol}</span>
                <span className="text-bags-muted text-xs">{t.weight.toFixed(1)}%</span>
                <ScoreBadge score={t.score} size="sm" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
