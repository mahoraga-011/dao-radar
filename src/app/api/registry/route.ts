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

  const parsed = raw
    .filter((entry: unknown) => {
      const e = entry as Record<string, unknown>;
      return typeof e.realmId === "string" && e.realmId.length > 0;
    })
    .map((entry: unknown) => {
      const e = entry as Record<string, unknown>;
      return {
        realmId: e.realmId as string,
        symbol: (e.symbol as string) || "",
        displayName: (e.displayName as string) || (e.symbol as string) || "",
        ogImage: resolveImageUrl(e.ogImage as string | undefined),
        category: (e.category as string) || undefined,
        shortDescription: (e.shortDescription as string) || undefined,
        website: (e.website as string) || undefined,
        twitter: (e.twitter as string) || undefined,
        discord: (e.discord as string) || undefined,
        programId: (e.programId as string) || "",
      };
    });

  return NextResponse.json(parsed);
}
