// In-memory cache
const summaryCache = new Map<string, { summary: string; impact: string }>();

export async function summarizeProposal(
  title: string,
  description: string
): Promise<{ summary: string; impact: string }> {
  const cacheKey = `${title}::${description.slice(0, 200)}`;
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
