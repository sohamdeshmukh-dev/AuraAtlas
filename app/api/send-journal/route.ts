import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    // We catch the data sent from your Journal form
    const { email, mood, streak, totalEntries } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'Aura Atlas <onboarding@resend.dev>',
      to: [email],
      subject: `📖 Journal Logged: Feeling ${mood}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; background-color: #050913; color: #e2e8f0; padding: 40px; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 15px;">✨</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.02em;">Journal Saved</h1>
            <p style="color: #94a3b8; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 8px;">Aura Atlas Deep Reflection</p>
          </div>

          <div style="background: linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%); border-radius: 20px; padding: 30px; margin-bottom: 24px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.05);">
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px 0;">You checked in today feeling:</p>
            <h2 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 700; text-transform: capitalize;">${mood}</h2>
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 30px; justify-content: center;">
            <div style="flex: 1; background-color: rgba(255, 255, 255, 0.03); border-radius: 18px; padding: 20px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.05);">
              <p style="color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">Day Streak</p>
              <h2 style="color: #fb923c; font-size: 24px; margin: 0; font-weight: 700;">🔥 ${streak}</h2>
            </div>
            <div style="flex: 1; background-color: rgba(255, 255, 255, 0.03); border-radius: 18px; padding: 20px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.05);">
              <p style="color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">Total Entries</p>
              <h2 style="color: #eab308; font-size: 24px; margin: 0; font-weight: 700;">📝 ${totalEntries}</h2>
            </div>
          </div>

          <div style="padding: 0 20px;">
            <p style="color: #94a3b8; font-size: 13px; text-align: center; line-height: 1.6; font-style: italic;">
              "The act of journaling is the act of witness. You are acknowledging your own existence and honoring your emotional truth."
            </p>
            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent); margin: 20px 0;"></div>
            <p style="color: #475569; font-size: 11px; text-align: center; line-height: 1.5;">
              Taking the time to write down your thoughts is a vital step for your mental wellness. Be proud of yourself for showing up today.
            </p>
          </div>
          
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
