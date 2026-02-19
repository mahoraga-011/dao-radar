# DAO Radar

**Your governance command center for Solana DAOs.**

> Scan every DAO you belong to. AI-powered proposal intelligence. One-click voting across all your Solana DAOs.

<!-- Screenshot will be added after deployment -->

## Features

- **DAO Discovery** — Automatically detect all DAOs where you hold governance tokens
- **AI Proposal Summaries** — Complex proposals decoded into plain English using Groq/LLaMA
- **One-Click Voting** — Cast votes (For / Against / Abstain) without leaving the app
- **Browse Mode** — Explore 12 featured Solana DAOs without connecting a wallet
- **Voting History** — Track your governance participation across all DAOs
- **Real-time Status** — See active proposals, vote counts, and governance state

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Blockchain:** Solana Web3.js + SPL Governance SDK
- **AI:** Groq API (LLaMA 3.1 8B)
- **RPC:** Helius
- **Icons:** Phosphor Icons
- **Font:** Plus Jakarta Sans

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys:
#   SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
#   OPENAI_API_KEY=your_openai_api_key

# Run development server
pnpm dev

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SOLANA_RPC_URL` | Solana RPC endpoint — server-side only, proxied via `/api/rpc` |
| `OPENAI_API_KEY` | OpenAI API key for AI proposal summaries |

## Deployment

Deployed on [Vercel](https://dao-radar.vercel.app).

---

Built for the **Solana Graveyard Hackathon** — Realms DAO track.
