const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// In-memory cache
const summaryCache = new Map<string, { summary: string; impact: string }>();

export async function summarizeProposal(
  title: string,
  description: string
): Promise<{ summary: string; impact: string }> {
  const cacheKey = `${title}::${description.slice(0, 200)}`;
  const cached = summaryCache.get(cacheKey);
  if (cached) return cached;

  // Also check localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`ai_summary_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        summaryCache.set(cacheKey, parsed);
        return parsed;
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
        localStorage.setItem(`ai_summary_${cacheKey}`, JSON.stringify(result));
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
        : `Proposal: ${title}`,
      impact: "Unknown",
    };
  }
}
