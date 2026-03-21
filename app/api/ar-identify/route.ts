import OpenAI from "openai";
import { NextResponse } from "next/server";
import { UVA_BUILDINGS } from "@/lib/uvaBuildings";
import { haversineDistance } from "@/lib/arGeo";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { imageBase64, latitude, longitude } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    // Build a GPS-aware context: tell GPT which buildings are nearby
    let locationCtx =
      "The user is somewhere on or near the University of Virginia campus in Charlottesville, VA.";
    let nearbyHint = "";

    if (latitude && longitude) {
      locationCtx = `The user is at GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)}), on the University of Virginia campus.`;

      // Sort buildings by distance and tell GPT the closest ones
      const ranked = UVA_BUILDINGS.map((b) => ({
        name: b.name,
        dist: haversineDistance(latitude, longitude, b.latitude, b.longitude),
      }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 8);

      nearbyHint = `\n\nBased on GPS, the closest buildings (in order) are:\n${ranked
        .map((r, i) => `${i + 1}. ${r.name} — ${Math.round(r.dist)}m away`)
        .join("\n")}\n\nUse this proximity data to help narrow your identification. The building they are looking at is very likely one of the top entries.`;
    }

    // Full known building list
    const allBuildingNames = UVA_BUILDINGS.map((b) => b.name).join(", ");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a building-identification AI for a mental health campus app at the University of Virginia.

${locationCtx}${nearbyHint}

Given a photo taken by the user, identify which UVA building or landmark they are looking at.

Known UVA buildings in our database: ${allBuildingNames}.
Other UVA landmarks you may recognize: Bryan Hall, Cocke Hall, Garrett Hall, Gilmer Hall, Chemistry Building, Brown College, Hereford College, Runk Dining, Aquatic & Fitness Center, University Chapel, Amphitheater, McIntire School, Darden School, John Paul Jones Arena, Bavaro Hall, Campbell Hall.

CRITICAL RULES:
1. If the GPS data shows a building is very close (< 100m), heavily weight that in your identification.
2. Look for architectural features: columned facades → Rotunda or Old Cabell. Red brick Georgian → Lawn pavilions. Modern glass → Rice/Olsson. 
3. If you truly cannot identify the building, return "Unknown" — do not guess randomly.

Respond ONLY in JSON:
{
  "building_name": "string — the identified building name, or 'Unknown'",
  "confidence": "number — 0 to 100",
  "wellbeing_summary": "string — 1-2 sentence environmental psychology assessment of the space's emotional vibe",
  "emoji": "string — a single emoji representing the vibe"
}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What building am I looking at?" },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      max_tokens: 300,
    });

    const result = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("AR Identify API Error:", error);
    return NextResponse.json(
      { error: "Failed to identify building" },
      { status: 500 }
    );
  }
}
