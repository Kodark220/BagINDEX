import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import ScoreBadge from "./ScoreBadge";
import {
  ExternalLink,
  TrendingUp,
  Heart,
  Shield,
  Users,
  Brain,
  Globe,
  X,
  DollarSign,
  Droplets,
  BarChart3,
  UsersRound,
} from "lucide-react";

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
  status: string;
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
  aiReasoning?: string;
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(6)}`;
  return "$0.00";
}

const scoreDimensions = [
  { key: "momentum" as const, label: "Momentum", icon: TrendingUp, color: "from-orange-500 to-red-500", desc: "Volume, fees, price action" },
  { key: "health" as const, label: "Health", icon: Heart, color: "from-emerald-500 to-green-500", desc: "Liquidity, holders, organic score" },
  { key: "creatorTrust" as const, label: "Creator Trust", icon: Shield, color: "from-blue-500 to-cyan-500", desc: "Identity, socials, engagement" },
  { key: "community" as const, label: "Community", icon: Users, color: "from-purple-500 to-pink-500", desc: "Holder count, social presence" },
];

export default function TokenDetailModal({
  token,
  open,
  onOpenChange,
}: {
  token: EnrichedToken | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!token) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-bags-border overflow-hidden ring-2 ring-bags-border/50 shrink-0">
              {token.image ? (
                <img src={token.image} alt={token.symbol} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-bags-muted bg-bags-dark">
                  {token.symbol.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <DialogTitle className="text-xl">{token.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span>${token.symbol}</span>
                <Badge variant="outline" className="text-[10px]">{token.status}</Badge>
              </DialogDescription>
            </div>
            <div className="ml-auto">
              <ScoreBadge score={token.score.overall} size="lg" />
            </div>
          </div>
        </DialogHeader>

        {/* Description */}
        {token.description && (
          <p className="text-sm text-bags-muted leading-relaxed mt-2 border-l-2 border-bags-primary/30 pl-3">
            {token.description}
          </p>
        )}

        {/* Market stats grid */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <StatItem icon={DollarSign} label="Price" value={formatUsd(token.priceUsd)} />
          <StatItem icon={BarChart3} label="MCap" value={formatUsd(token.marketCap)} />
          <StatItem icon={TrendingUp} label="24h Vol" value={formatUsd(token.volume24h)} />
          <StatItem icon={Droplets} label="Liquidity" value={formatUsd(token.liquidity)} />
          <StatItem icon={UsersRound} label="Holders" value={token.holders.toLocaleString()} />
          <StatItem icon={DollarSign} label="Fees" value={`${token.lifetimeFees.toFixed(2)} SOL`} />
        </div>

        {/* Score breakdown */}
        <div className="mt-5 space-y-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-bags-primary" />
            Score Breakdown
          </h4>
          {scoreDimensions.map((dim) => {
            const value = token.score[dim.key];
            const Icon = dim.icon;
            return (
              <div key={dim.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Icon className="w-3.5 h-3.5 text-bags-muted" />
                    <span className="text-bags-text">{dim.label}</span>
                    <span className="text-[10px] text-bags-muted">{dim.desc}</span>
                  </div>
                  <span className={`text-sm font-bold ${value >= 70 ? "text-bags-green" : value >= 40 ? "text-bags-yellow" : "text-bags-red"}`}>
                    {value}
                  </span>
                </div>
                <Progress
                  value={value}
                  className="h-1.5"
                  indicatorClassName={`bg-gradient-to-r ${dim.color}`}
                />
              </div>
            );
          })}
        </div>

        {/* AI Reasoning */}
        {token.aiReasoning && (
          <div className="mt-5 p-3 rounded-lg bg-bags-dark/50 border border-bags-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-bags-primary" />
              <span className="text-sm font-semibold text-white">AI Analysis</span>
            </div>
            <p className="text-sm text-bags-muted leading-relaxed">{token.aiReasoning}</p>
          </div>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-2 mt-5">
          <a href={`https://bags.fm/${token.tokenMint}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-2">
              Trade on Bags <ExternalLink className="w-3 h-3" />
            </Button>
          </a>
          <a
            href={`https://dexscreener.com/solana/${token.tokenMint}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2">
              DexScreener <ExternalLink className="w-3 h-3" />
            </Button>
          </a>
          {token.twitter && (
            <a href={token.twitter} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-2">
                <X className="w-3.5 h-3.5" /> Twitter
              </Button>
            </a>
          )}
          {token.website && (
            <a href={token.website} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-2">
                <Globe className="w-3.5 h-3.5" /> Website
              </Button>
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatItem({ icon: Icon, label, value }: { icon: typeof DollarSign; label: string; value: string }) {
  return (
    <div className="bg-bags-dark/50 rounded-lg p-2.5 border border-bags-border/50">
      <div className="text-[10px] text-bags-muted uppercase tracking-widest flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-white font-semibold text-sm mt-0.5">{value}</div>
    </div>
  );
}
