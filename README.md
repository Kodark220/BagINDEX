# 🎒 BagsIndex — AI-Powered Creator Token Index Funds

**BagsIndex** is an autonomous AI agent that builds and auto-rebalances curated index funds across the Bags creator token ecosystem on Solana.

> *Think S&P 500, but for creator tokens.*

## 🚀 What It Does

1. **Ingests** every creator token on Bags (top-tokens + feed endpoints, 270+ tokens)
2. **Scores** each token using a 4-dimensional model — Momentum, Health, Creator Trust, Community — enhanced by Groq Llama 3.3 70B qualitative analysis
3. **Builds** 5 differentiated index funds with tightened filters and proper sort criteria
4. **Rebalances** every 5 minutes autonomously via Vercel Cron Jobs
5. **Displays** live data in a polished dashboard with real-time polling

## 📊 The Five Indexes

| Index | Strategy | Description |
|-------|----------|-------------|
| 🚀 **Momentum Leaders** | `top-momentum` | High-volume, high-momentum tokens — the S&P 500 of Bags |
| ⭐ **Rising Stars** | `rising-stars` | Small-cap tokens with outsized early traction |
| 💎 **Blue Chip Creators** | `blue-chip` | Highest market cap with proven creator engagement |
| 🤲 **Diamond Hands** | `diamond-hands` | Strongest holder conviction and organic communities |
| 💰 **High Yield** | `high-yield` | Top fee revenue generators — maximise creator royalties |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (React + Vite + Tailwind + shadcn) │
│  Auto-polling dashboard with framer-motion   │
├─────────────────────────────────────────────┤
│  Vercel Serverless API (Express)             │
│  ├── /api/indexes    — Index fund data       │
│  ├── /api/tokens     — Scored token data     │
│  ├── /api/status     — Agent health          │
│  ├── /api/rebalance  — Manual trigger        │
│  └── /api/launch     — Token launch (Solana) │
├─────────────────────────────────────────────┤
│  AI Scoring Engine                           │
│  ├── Quantitative: 4D scoring model          │
│  └── Qualitative: Groq Llama 3.3 70B        │
├─────────────────────────────────────────────┤
│  Data Pipeline                               │
│  ├── Bags API (top-tokens + feed)            │
│  ├── DexScreener (market data)               │
│  └── Vercel Cron (5-min auto-rebalance)      │
└─────────────────────────────────────────────┘
```

## 🔧 Tech Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3, shadcn/ui, framer-motion
- **Backend**: Node.js, Express, TypeScript (Vercel Serverless)
- **AI**: Groq (Llama 3.3 70B Versatile) via OpenAI SDK
- **Blockchain**: Solana (@solana/web3.js, Bags SDK)
- **Data**: Bags REST API v2, DexScreener batch API
- **Scheduling**: Vercel Cron Jobs (every 5 minutes)

## 🏃 Quick Start (Local Development)

```bash
# Install dependencies
npm run install:all

# Create .env from template
cp .env.example .env
# Fill in: BAGS_API_KEY, GROQ_API_KEY, SOLANA_RPC_URL, PRIVATE_KEY

# Run both server + client in dev mode
npm run dev
```

Server runs at `http://localhost:3001`, client at `http://localhost:5173`.

## ☁️ Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Environment variables** to set in Vercel Dashboard → Settings → Environment Variables:
- `BAGS_API_KEY` — Your Bags API key
- `GROQ_API_KEY` — Free Groq API key
- `SOLANA_RPC_URL` — Solana RPC endpoint (e.g. Helius, QuickNode)
- `PRIVATE_KEY` — Solana private key (base58) for token launching

## 🧠 How AI Scoring Works

Each token receives a **0–100 score** across four dimensions:

| Dimension | Weight | Factors |
|-----------|--------|---------|
| **Momentum** | 30% | 24h volume, lifetime fees, market cap, price change |
| **Health** | 25% | Liquidity, holders, liq/mcap ratio, organic score, trader count |
| **Creator Trust** | 25% | Creator identity, socials, fee claiming, description quality |
| **Community** | 20% | Holder count, social presence, volume per holder |

Top 20 tokens then pass through **Groq Llama 3.3 70B** for qualitative adjustment (legitimacy, organic growth, red flags).

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/indexes` | List all 5 index funds |
| GET | `/api/indexes/:id` | Get specific index with allocations |
| GET | `/api/tokens` | All scored tokens (sort: score, volume, marketcap, fees) |
| GET | `/api/tokens/:mint` | Individual token analysis |
| GET | `/api/status` | Agent status + uptime |
| GET | `/api/rebalance/history` | Rebalance event log |
| POST | `/api/rebalance/trigger` | Force immediate rebalance |
| POST | `/api/launch` | Launch the BagsIndex token on Bags |

## 📁 Project Structure

```
├── api/                     # Vercel serverless entry
│   └── index.ts             # Express app as serverless function
├── server/                  # Backend logic
│   ├── config.ts            # Environment variables
│   ├── types.ts             # TypeScript interfaces
│   ├── routes/api.ts        # REST API endpoints
│   └── services/
│       ├── index-manager.ts # Data pipeline + index builder
│       ├── ai-scorer.ts     # 4D scoring + Groq AI
│       ├── bags-api.ts      # Bags API client
│       ├── market-data.ts   # DexScreener batch API
│       ├── rebalancer.ts    # Cron scheduling (local dev)
│       └── token-launcher.ts# Solana token launch
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Dashboard, Tokens, IndexDetail
│   │   ├── hooks/useApi.ts  # Generic polling hook
│   │   └── App.tsx          # Router
│   └── vite.config.ts       # Proxy config
├── vercel.json              # Vercel deployment config
└── package.json             # Root config with scripts
```

## 🏆 The Bags Hackathon

Built for **The Bags Hackathon** on [DoraHacks](https://dorahacks.io) — AI Agents track.

**BagsIndex** demonstrates:
- Autonomous agent behavior (self-managing rebalance cycles)
- Deep integration with the Bags API ecosystem
- AI-powered decision making (Groq LLM scoring)
- Solana on-chain capability (token launching via Bags SDK)
- Production-ready deployment on Vercel

## 📄 License

MIT
|-----------|-----------------|--------|
| **Momentum** | 24h volume, lifetime fees, market cap | 30% |
| **Health** | Liquidity depth, holder count, liq/mcap ratio | 25% |
| **Creator Trust** | Social presence, fee claim activity, project completeness | 25% |
| **Community** | Holder count, social links, volume per holder | 20% |

When an OpenAI key is provided, the AI layer adjusts scores with qualitative analysis (detecting red flags, assessing project legitimacy).

## 🛠 Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Frontend:** React, Vite, Tailwind CSS
- **Data:** Bags API, DexScreener API
- **AI:** OpenAI GPT-4o-mini
- **Blockchain:** Solana, @solana/web3.js, @bagsfm/bags-sdk
- **Scheduling:** node-cron (30-min rebalance cycles)

## 📋 Hackathon Track

**AI Agents** — BagsIndex is an autonomous agent that continuously analyzes the Bags ecosystem and manages index fund portfolios without human intervention.

## 🗺 Roadmap

- **Phase 1 (Hackathon):** Scoring engine, 5 index funds, dashboard, auto-rebalancing
- **Phase 2:** On-chain index tokens (buy one token = buy the basket), historical performance tracking
- **Phase 3:** User-created custom indexes, social trading features
- **Phase 4:** Cross-platform index funds (Bags + other creator token platforms)

## 📜 License

MIT
