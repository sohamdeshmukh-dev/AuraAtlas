import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cheap for hackathons!
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an environmental psychologist AI for a mental health app. 
          Analyze the provided image of a location. Determine the emotional 'vibe', stress level, and safety feeling of this space. 
          Respond ONLY in JSON format with these exact keys: 
          "emoji" (a single emoji representing the vibe), 
          "title" (2-3 words, e.g., 'Calm Nature' or 'Busy Urban Area'), 
          "stressLevel" (a string: 'Low', 'Medium', or 'High'), 
          "advice" (1 short sentence of what the user should do here).`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this environment." },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
    });

    const aiAnalysis = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json(aiAnalysis);

  } catch (error) {
    console.error("Vision API Error:", error);
    return NextResponse.json({ error: "Failed to analyze scene" }, { status: 500 });
  }
}
