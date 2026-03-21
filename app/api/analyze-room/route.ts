import { OpenAI } from "openai";
import { NextResponse } from "next/server";

// Ensure you have OPENAI_API_KEY in your .env.local file!
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: `You are the 'Aura Atlas' spatial intelligence engine. 
          Analyze the provided image of a room/environment for sensory load (lighting harshness, clutter, crowds, general vibe). 
          Return ONLY a JSON object with three keys:
          1. "score" (a number from 0-1000 representing the calm/focus level)
          2. "sentiment" (a 2-3 word summary, e.g., "High Stimulation" or "Deep Calm")
          3. "recommendation" (A single, highly contextual sentence advising the student what to do in this space).`
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse and return the GPT JSON response
    const result = JSON.parse(response.choices[0].message?.content || "{}");
    return NextResponse.json(result);

  } catch (error) {
    console.error("GPT Vision Error:", error);
    return NextResponse.json({ error: "Failed to analyze room" }, { status: 500 });
  }
}
