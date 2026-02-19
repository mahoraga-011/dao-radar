import { NextResponse } from "next/server";

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// Token bucket rate limiter: 20 req/s burst, refills at 20/s
// Allows bursts while preventing sustained abuse
const buckets = new Map<string, { tokens: number; lastRefill: number }>();
const BUCKET_MAX = 100;
const REFILL_RATE = 50; // tokens per second

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket) {
    bucket = { tokens: BUCKET_MAX - 1, lastRefill: now };
    buckets.set(ip, bucket);
    return false;
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(BUCKET_MAX, bucket.tokens + elapsed * REFILL_RATE);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) return true;
  bucket.tokens -= 1;
  return false;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > 120_000) buckets.delete(key);
  }
}, 5 * 60_000);

// Allowed JSON-RPC methods (whitelist to prevent abuse)
const ALLOWED_METHODS = new Set([
  "getAccountInfo",
  "getMultipleAccounts",
  "getProgramAccounts",
  "getLatestBlockhash",
  "sendRawTransaction",
  "confirmTransaction",
  "getSignatureStatuses",
  "getTransaction",
  "getBalance",
  "getSlot",
]);

export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate JSON-RPC structure
    if (!body.method || typeof body.method !== "string") {
      return NextResponse.json(
        { error: "Invalid RPC request" },
        { status: 400 }
      );
    }

    // Whitelist check
    if (!ALLOWED_METHODS.has(body.method)) {
      return NextResponse.json(
        { error: `Method not allowed: ${body.method}` },
        { status: 403 }
      );
    }

    const res = await fetch(SOLANA_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("RPC proxy error:", err);
    return NextResponse.json(
      { error: "RPC request failed" },
      { status: 502 }
    );
  }
}
