import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();

    if (!GROQ_API_KEY) {
      return NextResponse.json({
        summary: description?.slice(0, 200) || title,
        impact: "Unknown",
      });
    }

    const prompt = `You are a governance analyst. Analyze this DAO proposal and provide:
1. A clear 2-3 sentence summary in plain English
2. An impact assessment (Low, Medium, or High) with a brief reason

Proposal Title: ${title}
Proposal Description: ${description || "No description available"}

Respond in JSON format:
{"summary": "...", "impact": "High - reason" }`;

    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq error:", errText);
      return NextResponse.json({
        summary: description?.slice(0, 200) || title,
        impact: "Unknown",
      });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json({
        summary: parsed.summary || title,
        impact: parsed.impact || "Unknown",
      });
    } catch {
      return NextResponse.json({
        summary: content?.slice(0, 300) || title,
        impact: "Unknown",
      });
    }
  } catch (err) {
    console.error("Summarize API error:", err);
    return NextResponse.json(
      { summary: "Failed to generate summary", impact: "Unknown" },
      { status: 500 }
    );
  }
}
