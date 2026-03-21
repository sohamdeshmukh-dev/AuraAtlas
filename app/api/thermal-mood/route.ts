import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { temp, humidity, condition } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Blazing fast and cheap for this task
      messages: [
        {
          role: "system",
          content: `You are the Aura Atlas environmental psychologist. 
          Analyze the current weather (${temp}°F, ${humidity}% humidity, ${condition}) and its psychological/physiological impact on a college campus (cognitive load, lethargy, stress).
          Return ONLY a JSON object with two keys:
          1. "impact" (2 sentences explaining the atmospheric vibe)
          2. "recommendation" (1 actionable tip for a student right now)`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message?.content || "{}");
    return NextResponse.json(result);

  } catch (error) {
    console.error("Thermal AI Error:", error);
    return NextResponse.json({ error: "Failed to analyze atmosphere" }, { status: 500 });
  }
}
