import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, diaryText } = await req.json();

    if (!userId || !diaryText) {
      return NextResponse.json({ error: "userId and diaryText are required" }, { status: 400 });
    }

    // 1. Ask GPT to score the diary entry (Gamification!)
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are the Aura Atlas scoring engine. 
          Analyze this diary entry. Award points based on:
          - Base points for checking in: 50 pts
          - Emotional awareness/depth: 0-50 pts
          Return ONLY a JSON object with: 
          {"points_awarded": number, "encouragement": "a short nice message"}`
        },
        { role: "user", content: diaryText }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message?.content || '{"points_awarded": 50, "encouragement": "Good job!"}');
    const earnedPoints = result.points_awarded;

    // 2. Save the points to Supabase (using smile_points column as per request)
    // We fetch current points, add the new points, and update!
    const { data: user } = await supabase.from('profiles').select('smile_points').eq('id', userId).single();
    const currentPoints = user?.smile_points || 0;
    const newTotal = currentPoints + earnedPoints;

    await supabase.from('profiles').update({ smile_points: newTotal }).eq('id', userId);

    // 3. Save the actual diary entry so they can read it later
    await supabase.from('diary_entries').insert([{ 
      user_id: userId, 
      content: diaryText, 
      points_earned: earnedPoints 
    }]);

    return NextResponse.json({ success: true, earnedPoints, newTotal, message: result.encouragement });

  } catch (error) {
    console.error("Scoring Error:", error);
    return NextResponse.json({ error: "Failed to score entry" }, { status: 500 });
  }
}
