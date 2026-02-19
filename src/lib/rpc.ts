// Server-side: use the direct RPC URL with Helius key
// Client-side: use the /api/rpc proxy (hides Helius API key)
const isServer = typeof window === "undefined";

export const RPC_URL = isServer
  ? (process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com")
  : `${typeof window !== "undefined" ? window.location.origin : ""}/api/rpc`;

// Full public endpoint for ConnectionProvider (wallet adapter context only)
export const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
