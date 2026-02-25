import { NextResponse } from "next/server";

const REGISTRY_URL =
  "https://raw.githubusercontent.com/solana-labs/governance-ui/main/public/realms/mainnet-beta.json";

// Next.js caches this GET response and revalidates every hour
export const revalidate = 3600;

function resolveImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `https://app.realms.today${url}`;
  return url;
}

export async function GET() {
  const res = await fetch(REGISTRY_URL, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch registry" },
      { status: 502 }
    );
  }

  const raw: unknown[] = await res.json();

  function str(val: unknown): string {
    return typeof val === "string" ? val : "";
  }
  function optStr(val: unknown): string | undefined {
    return typeof val === "string" && val.length > 0 ? val : undefined;
  }

  const parsed = raw
    .filter((entry: unknown) => {
      if (!entry || typeof entry !== "object") return false;
      const e = entry as Record<string, unknown>;
      return typeof e.realmId === "string" && e.realmId.length > 0;
    })
    .map((entry: unknown) => {
      const e = entry as Record<string, unknown>;
      return {
        realmId: str(e.realmId),
        symbol: str(e.symbol),
        displayName: str(e.displayName) || str(e.symbol),
        ogImage: resolveImageUrl(optStr(e.ogImage)),
        category: optStr(e.category),
        shortDescription: optStr(e.shortDescription),
        website: optStr(e.website),
        twitter: optStr(e.twitter),
        discord: optStr(e.discord),
        programId: str(e.programId),
      };
    });

  return NextResponse.json(parsed);
}
