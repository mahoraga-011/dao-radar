# DAO Radar

**Your governance command center for Solana DAOs.**

> Scan every DAO you belong to. AI-powered proposal intelligence. One-click voting across all your Solana DAOs.

## Features

- **DAO Discovery** — Auto-detect all DAOs where you hold governance tokens
- **AI Proposal Summaries** — Proposals decoded into plain English with impact ratings using GPT-4o-mini
- **One-Click Voting** — Cast votes (For / Against / Abstain) without leaving the app
- **Browse Mode** — Explore 18 featured Solana DAOs (Jupiter, Drift, Marinade, Pyth, etc.) without connecting a wallet
- **Explore 4,000+ DAOs** — Browse the full Solana DAO registry with search, pagination, and on-chain toggle
- **Voting History** — Track your governance participation across all DAOs
- **Real-time Status** — Active proposals, live vote counts, and governance state at a glance

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with animated radar, feature overview, and CTAs |
| `/dashboard` | Your DAOs (wallet connected) or featured DAOs (browse mode) |
| `/explore` | Browse 4,000+ Solana DAOs with search and pagination |
| `/dao/[realmId]` | DAO detail — proposals, filters, vote bars |
| `/proposal/[proposalId]` | Proposal detail with AI summary and voting |
| `/history` | Your voting history across all DAOs |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Blockchain | Solana Web3.js, SPL Governance SDK |
| Wallets | Phantom, Solflare (via Wallet Adapter) |
| AI | OpenAI GPT-4o-mini |
| RPC | Helius (proxied via `/api/rpc` with rate limiting) |
| Icons | Phosphor Icons |
| Font | Plus Jakarta Sans |

## Architecture

```
src/
├── app/
│   ├── layout.tsx                     # Root layout, metadata, providers
│   ├── page.tsx                       # Landing page
│   ├── dashboard/page.tsx             # User/browse dashboard
│   ├── explore/page.tsx               # DAO explorer
│   ├── dao/[realmId]/page.tsx         # DAO detail
│   ├── proposal/[proposalId]/page.tsx # Proposal detail + voting
│   ├── history/page.tsx               # Voting history
│   └── api/
│       ├── rpc/route.ts               # RPC proxy (token bucket rate limiter)
│       ├── summarize/route.ts         # AI summary endpoint
│       └── registry/route.ts          # DAO registry (ISR, 1hr cache)
├── components/                        # Navbar, Footer, WalletProvider, etc.
├── contexts/
│   └── GovernanceContext.tsx           # Shared governance state
└── lib/
    ├── governance.ts                  # SPL Governance SDK wrappers
    ├── registry.ts                    # Registry caching
    ├── ai-summary.ts                  # Summary client
    ├── rpc.ts                         # Connection setup
    └── utils.ts                       # Formatting helpers
```

### API Routes

- **`/api/rpc`** — RPC proxy with token bucket rate limiter (100 burst, 50/s refill), method whitelist, IP-based tracking
- **`/api/summarize`** — AI proposal summaries with rate limiting (10/min per IP) and prompt injection sanitization
- **`/api/registry`** — DAO registry from Mythic-Project/governance-ui with ISR (1-hour revalidation)

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
pnpm dev

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SOLANA_RPC_URL` | Yes | Solana mainnet RPC endpoint (e.g. Helius). Proxied server-side via `/api/rpc` |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI proposal summaries |

## Deployment

Deployed on [Vercel](https://dao-radar.vercel.app). Works out of the box with Vercel — just set the environment variables.

## Network

Configured for **Solana mainnet-beta**. The SPL Governance program ID (`GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw`) and all RPC endpoints point to mainnet. The DAO registry is sourced from the official [governance-ui mainnet-beta registry](https://github.com/Mythic-Project/governance-ui/blob/master/public/realms/mainnet-beta.json).

---

Built for the **Solana Graveyard Hackathon** — Realms DAO track.
