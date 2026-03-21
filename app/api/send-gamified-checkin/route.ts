import { ReflectionCompleteEmail } from '@/emails/ReflectionComplete';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, smileScore, streak, nextCheckInTime } = await req.json();

    const data = await resend.emails.send({
      from: 'Aura Atlas <onboarding@resend.dev>',
      to: [email],
      subject: `✨ +100 Points! Your Aura is glowing.`,
      react: ReflectionCompleteEmail({
        smileScore,
        streak,
        nextCheckInTime
      }) as React.ReactElement,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
