import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { FACTOR_WEIGHTS } from "@/lib/auraPoints";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Build the factor descriptions for the indoor prompt
const factorPrompt = Object.entries(FACTOR_WEIGHTS)
  .map(([key, val]) => `    "${key}": { "score": <0 to ${val.max}>, "description": "<1 sentence why>" }`)
  .join(",\n");

const SYSTEM_PROMPT = `You are an AI vision system integrated into the Aura Atlas AR wellness application.

STEP 1: Scene Classification
Classify the image into exactly ONE category:
- "indoor" — any interior space (room, hallway, office, dorm, etc.)
- "building_exterior" — exterior view of a building or structure

STEP 2A: If "indoor" → Return BOTH aura features AND detailed factor scores.
Return this JSON:
{
  "type": "aura",
  "features": {
    "lighting": <0-100>,
    "cleanliness": <0-100>,
    "spaciousness": <0-100>,
    "colorWarmth": <0-100>,
    "calmness": <0-100>,
    "aesthetic": <0-100>
  },
  "explanation": "<short explanation of detected features>",
  "factors": {
${factorPrompt}
  },
  "summary": "<2-3 word vibe label, e.g. 'Cozy Retreat' or 'Sterile Buzzkill'>",
  "recommendation": "<1 actionable sentence to improve this space's aura>"
}

Indoor factor scoring guidelines:
- natural_lighting (max 150): Abundant natural sunlight = high. Dark/no windows = low.
- artificial_light (max 80): Warm, diffused lighting = high. Harsh fluorescent = low.
- plants_greenery (max 120): Visible plants/biophilic elements = high. None = 0.
- natural_materials (max 60): Wood, stone, natural textiles = high. All plastic/synthetic = low.
- noise_level (max 120): Quiet/peaceful = high. Visually noisy/chaotic = low.
- clutter (max 100): Clean, organized = high. Messy, cluttered = low.
- openness (max 80): Spacious, good flow = high. Cramped = low.
- color_palette (max 100): Warm earth tones, nature colors = high. Harsh/cold/sterile = low.
- temperature_feel (max 90): Looks comfortable/cozy = high. Looks too hot/cold = low.
- water_elements (max 50): Water features, aquariums = high. None = 0.
- personal_touches (max 50): Art, photos, personality = high. Generic/institutional = low.

Be honest and specific. A typical dorm room might score 400-550. A spa might score 800+. A fluorescent office might score 200-350.

STEP 2B: If "building_exterior" → Detect the building and return mood data.
First check if the building matches known UVA buildings:
- Olsson Hall: traditional academic engineering building (brick, structured)
- Rice Hall: modern glass computer science building (glass facade, contemporary)

Return this JSON:
{
  "type": "building",
  "buildingName": "Olsson Hall" | "Rice Hall" | "Unknown Building",
  "smileyScore": <0-100>,
  "smileyEmoji": "<one of: 😄🙂😐😕😞>",
  "moodScore": <0-100>,
  "moodEmoji": "<one of: 😄🙂😐😕😞>",
  "attributes": {
    "architecture": <0-100>,
    "modernity": <0-100>,
    "activityLevel": <0-100>,
    "maintenance": <0-100>,
    "openness": <0-100>
  },
  "vibe": "<short phrase like 'innovative and energetic' or 'academic and structured'>"
}

Building scoring guidelines:
- Rice Hall: Boost modernity, glass, openness. Higher smiley (85-95), higher mood (75-90).
- Olsson Hall: More traditional, structured. Moderate smiley (70-82), moderate mood (65-75).
- Unknown buildings: Score based on visual impression honestly.

IMPORTANT RULES:
- Return ONLY clean JSON, nothing else.
- Always include the "type" field as the first key.
- Be concise and consistent in descriptions.`;

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message?.content || "{}");
    return NextResponse.json(result);

  } catch (error) {
    console.error("Aura Points Analysis Error:", error);
    return NextResponse.json({ error: "Failed to analyze environment" }, { status: 500 });
  }
}
