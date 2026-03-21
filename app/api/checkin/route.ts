import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Supabase (Use SERVICE_ROLE key here so it can update the rewards safely)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail, score } = await req.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ error: "Missing user data" }, { status: 400 });
    }

    // 💳 1. UPDATE CAPITAL ONE REWARDS (+50 Miles)
    // First, get their current miles
    const { data: profile } = await supabase
      .from("profiles") 
      .select("capital_one_miles")
      .eq("id", userId)
      .single();

    const currentMiles = profile?.capital_one_miles || 0;

    // Add 50 miles and save it back
    await supabase
      .from("profiles")
      .update({ capital_one_miles: currentMiles + 50 })
      .eq("id", userId);

    // ✅ NEW CODE (Hackathon Safe Mode)
    await resend.emails.send({
      from: "onboarding@resend.dev", // MUST use this for unverified domains
      to: "balajipratik8@gmail.com", // Hardcode your verified email for the demo
      subject: "Daily Check-in Complete! 🎉",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0d9488;">Great job checking in today!</h2>
          <p>You rated your mental clarity at a <strong>${score}</strong>.</p>
          <p>As a reward for building financial and mental resilience, we've added <strong>+50 Capital One Miles</strong> to your account!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated notification from Aura Atlas.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Check-in processing error:", error);
    return NextResponse.json({ error: "Failed to process rewards and email" }, { status: 500 });
  }
}
