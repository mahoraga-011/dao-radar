// Simple hash for cache keys (avoids collisions from slice-based keys)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

// In-memory cache
const summaryCache = new Map<string, { summary: string; impact: string }>();

export async function summarizeProposal(
  title: string,
  description: string
): Promise<{ summary: string; impact: string }> {
  const cacheKey = simpleHash(`${title}::${description}`);
  const cached = summaryCache.get(cacheKey);
  if (cached) return cached;

  // Also check localStorage (1 hour TTL)
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`ai_summary_${cacheKey}`);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          summaryCache.set(cacheKey, data);
          return data;
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error("Failed to summarize");

    const data = await res.json();
    const result = { summary: data.summary, impact: data.impact };

    summaryCache.set(cacheKey, result);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`ai_summary_${cacheKey}`, JSON.stringify({ data: result, timestamp: Date.now() }));
      } catch {
        // storage full
      }
    }

    return result;
  } catch (err) {
    console.error("AI summary error:", err);
    return {
      summary: description
        ? description.slice(0, 200) + (description.length > 200 ? "..." : "")
        : "Summary unavailable — could not generate AI analysis for this proposal.",
      impact: "Unknown",
    };
  }
}
