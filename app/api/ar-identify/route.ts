import OpenAI from "openai";
import { NextResponse } from "next/server";
import { UVA_BUILDINGS } from "@/lib/uvaBuildings";
import { haversineDistance } from "@/lib/arGeo";
import { buildVisualPromptForBuildings } from "@/lib/buildingVisualData";

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
    let visualRefData = "";

    if (latitude && longitude) {
      locationCtx = `The user is at GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)}), on the University of Virginia campus.`;

      // Sort buildings by distance and tell GPT the closest ones
      const ranked = UVA_BUILDINGS.map((b) => ({
        id: b.id,
        name: b.name,
        dist: haversineDistance(latitude, longitude, b.latitude, b.longitude),
      }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 8);

      nearbyHint = `\n\nBased on GPS, the closest buildings (in order) are:\n${ranked
        .map((r, i) => `${i + 1}. ${r.name} — ${Math.round(r.dist)}m away`)
        .join("\n")}\n\nUse this proximity data to help narrow your identification. The building they are looking at is very likely one of the top entries.`;

      // Inject detailed visual reference data for nearby buildings that have it
      const nearbyIds = ranked.map((r) => r.id);
      visualRefData = buildVisualPromptForBuildings(nearbyIds);
    } else {
      // No GPS — still inject all available visual data
      visualRefData = buildVisualPromptForBuildings(
        UVA_BUILDINGS.map((b) => b.id)
      );
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
${visualRefData}

CRITICAL RULES:
1. If the GPS data shows a building is very close (< 100m), heavily weight that in your identification.
2. If DETAILED VISUAL REFERENCE DATA is provided above, compare the photo's features against those descriptions — signage text, column style, materials, window patterns, and distinguishing traits. A match on inscribed building name text is virtually definitive.
3. Look for architectural features: columned portico with "OLSSON HALL" inscription → Olsson Hall. Columned facades with "THE ROTUNDA" or dome → Rotunda. Red brick Georgian → Lawn pavilions. Modern glass/metal with curved roofline → Rice Hall.
4. If you truly cannot identify the building, return "Unknown" — do not guess randomly.

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

    // Safe JSON parse — don't crash on malformed GPT output
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(response.choices[0].message.content || "{}");
    } catch {
      console.error(
        "AR Identify: failed to parse GPT response:",
        response.choices[0].message.content
      );
      result = {
        building_name: "Unknown",
        confidence: 0,
        wellbeing_summary: "Unable to process image.",
        emoji: "❓",
      };
    }

    // Enrich with our building database when we get a match
    const identifiedName = String(result.building_name || "");
    const matchedBuilding = UVA_BUILDINGS.find(
      (b) =>
        b.name.toLowerCase() === identifiedName.toLowerCase() ||
        b.id === identifiedName.toLowerCase().replace(/\s+/g, "-")
    );

    if (matchedBuilding) {
      result.building_id = matchedBuilding.id;
      result.wellbeing_score = matchedBuilding.wellbeing_score;
      result.emotion_breakdown = matchedBuilding.emotion_breakdown;
      result.description = matchedBuilding.description;
      result.emoji_vibe = matchedBuilding.emoji_vibe;
      result.category = matchedBuilding.category;
      result.visual_features = matchedBuilding.visual_features;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("AR Identify API Error:", error);
    return NextResponse.json(
      { error: "Failed to identify building" },
      { status: 500 }
    );
  }
}

