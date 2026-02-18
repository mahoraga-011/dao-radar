import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.slice(0, 500) : '';
    const description = typeof body.description === 'string' ? body.description.slice(0, 10000) : '';

    if (!title && !description) {
      return Response.json({ error: 'Title or description required' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({
        summary: description?.slice(0, 200) || title,
        impact: "Unknown",
      });
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a governance proposal analyst. Summarize the following DAO proposal in plain English. Return JSON with \"summary\" (2-3 sentences) and \"impact\" (Low/Medium/High with brief reason). Only return valid JSON, nothing else.",
          },
          {
            role: "user",
            content: `Proposal Title: ${title}\n\nProposal Description:\n${description}`,
          },
        ],
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
