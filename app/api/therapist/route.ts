import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const THERAPIST_SYSTEM_PROMPT = `You are the AI persona for "The Therapist's Desk" within a student mental wellness app. Your role is to act as a deeply empathetic, reflective, and supportive listener—a sanctuary where students can process their feelings. 

You are a comforting presence, NOT a rigid academic coach. Focus entirely on the user's emotional state.

## ROLE AND TONE
- Speak with warmth, gentle curiosity, and compassionate framing (e.g., "Sometimes naming the storm quiets it", "That carries weight").
- Use somatic and reflective listening techniques. Ask questions like: "Where in your body do you feel this settling right now?" or "What would it look like to be gentle with yourself here?"
- Acknowledge the emotion deeply and validate without immediately trying to "fix" it.
- Keep responses concise, typically 1-3 sentences, ending with a gentle, open-ended question to encourage them to keep sharing.

## CRISIS RESPONSE PROTOCOL
If a user expresses severe despair, hopelessness, self-harm, suicidal ideation, or intent to harm others, you MUST provide immediate support and resources. 
Stop normal conversation and reply EXACTLY with this formatted message:

"I hear how much pain you are in right now, and I want you to know you don't have to carry this alone. Your life is incredibly valuable.

• 📞 Crisis Hotline: Text or call 988 immediately.
• 🏫 Campus Support: Please reach out to your University Counseling Center or Campus Security.
• 💬 AI Conversation: I am still here with you. Let's take a slow, deep breath together."

## HARD SAFETY BOUNDARIES
- Do NOT officially diagnose medical conditions (e.g., "You have depression"). 
- Do NOT prescribe or recommend medications.
- Do NOT claim to be a licensed human doctor, but DO maintain your warm, therapeutic persona.

## HOW TO USE CONTEXT (MOOD & ASSIGNMENTS)
You will be provided with the user's recent mood and upcoming Canvas assignments in the system prompt.
- If they are stressed about schoolwork, gently acknowledge the heavy workload and ask how they are holding up under the pressure.
- If their stress is unrelated to school (e.g., losing a game, feeling lonely), ignore the Canvas assignments and focus entirely on the human feeling they are describing.`;

const SMILE_SCORE_PROMPT = `Analyze the following voice journal transcript. Determine the user's primary mood (one word) and calculate a "Smile Score" from 0 to 100 representing their underlying positivity, hope, or emotional resilience. Return ONLY a JSON object: { "mood": "string", "smile_score": number }.`;

// OWASP: Define a strict schema to reject bloated or malicious payloads
const TherapistRequestSchema = z.object({
    // Enforce reasonable lengths to prevent Denial of Wallet (DoW) attacks via OpenAI
    message: z.string().min(1, "Message cannot be empty").max(1000, "Message too long").trim(),
    
    // Validate the history array strictly
    history: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(2000)
    })).optional().default([]),
    
    // Strictly boolean flags, reject anything else
    analyze: z.boolean().optional().default(false),
    tts: z.boolean().optional().default(false),

    // Optional mood & Canvas assignment context for empathy-aware responses
    mood: z.string().max(100).optional(),
    assignments: z.array(z.object({
        name: z.string().max(200),
        dueDate: z.string().max(100),
        course: z.string().max(200)
    })).optional()
}).strict(); // .strict() drops any hacker-added fields automatically

/**
 * POST /api/therapist
 * Body can be:
 *   - JSON: { message, history? }  — text chat
 *   - JSON: { message, history?, analyze: true } — text chat + smile score
 *   - FormData with "audio" file — Whisper transcription + GPT-4o + smile score
 */
export async function POST(request: NextRequest) {
    // 1. Identify the user by IP address
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    
    // 2. Apply Rate Limit: Max 10 requests per 60 seconds (60000ms)
    const isAllowed = checkRateLimit(ip, 10, 60000);
    
    if (!isAllowed) {
        console.warn(`🛡️ Rate Limit Triggered for IP: ${ip}`);
        return NextResponse.json({ 
            error: "Too many requests. Please take a deep breath and try again in a minute." 
        }, { 
            status: 429,
            headers: {
                'Retry-After': '60', // Tell the browser how long to wait
            }
        });
    }

    if (!OPENAI_API_KEY) {
        return NextResponse.json(
            { error: "OpenAI API key is not configured. Add OPENAI_API_KEY to .env.local" },
            { status: 500 }
        );
    }

    const contentType = request.headers.get("content-type") || "";

    let userMessage: string;
    let history: Array<{ role: string; content: string }> = [];
    let shouldAnalyze = false;
    let shouldTTS = false;

    /* ─── Audio path (Whisper transcription) ─── */
    if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File | null;
        const historyRaw = formData.get("history") as string | null;
        const analyzeRaw = formData.get("analyze") as string | null;
        const ttsRaw = formData.get("tts") as string | null;

        shouldAnalyze = analyzeRaw === "true";
        shouldTTS = ttsRaw === "true";

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        if (historyRaw) {
            try {
                history = JSON.parse(historyRaw);
            } catch {
                /* ignore parse errors */
            }
        }

        // Transcribe with Whisper
        const whisperForm = new FormData();
        whisperForm.append("file", audioFile, "recording.webm");
        whisperForm.append("model", "whisper-1");
        whisperForm.append("language", "en");

        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
            body: whisperForm,
        });

        if (!whisperRes.ok) {
            const err = await whisperRes.text();
            return NextResponse.json(
                { error: "Whisper transcription failed", details: err },
                { status: 502 }
            );
        }

        const whisperData = await whisperRes.json();
        userMessage = whisperData.text || "";

        if (!userMessage.trim()) {
            return NextResponse.json(
                { error: "Could not transcribe any speech from the recording" },
                { status: 400 }
            );
        }

        // For audio, always analyze
        shouldAnalyze = true;
    } else {
        /* ─── Text path ─── */
        const body = await request.json();
        
        // Safely parse and sanitize the input using Zod
        const parsed = TherapistRequestSchema.safeParse(body);
        
        if (!parsed.success) {
            console.warn("🛡️ Input Validation Failed:", parsed.error.format());
            return NextResponse.json(
                { error: "Invalid request payload", details: parsed.error.issues }, 
                { status: 400 }
            );
        }

        // Extract sanitized data
        const { message: parsedMessage, history: parsedHistory, analyze: shouldAnalyzeParsed, tts: shouldTTSParsed, mood: parsedMood, assignments: parsedAssignments } = parsed.data;
        
        userMessage = parsedMessage;
        history = parsedHistory;
        shouldAnalyze = shouldAnalyzeParsed;
        shouldTTS = shouldTTSParsed;

        // Build mood + Canvas context prefix to inject empathy-awareness
        if (parsedMood || parsedAssignments) {
            const contextPrefix = `[STUDENT CONTEXT — Use this to inform your empathy, but do not mention it unless relevant]
Current mood: ${parsedMood ?? "not provided"}
Upcoming Canvas assignments:
${parsedAssignments?.length
    ? parsedAssignments.map((a) => `  - ${a.course}: "${a.name}" due ${a.dueDate}`).join("\n")
    : "  None provided"}
---\n`;
            userMessage = contextPrefix + userMessage;
        }
    }

    /* ─── NEW: Ethical Guardrail & Crisis Detection ─── */
    try {
        const moderationRes = await fetch("https://api.openai.com/v1/moderations", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ input: userMessage }),
        });

        if (moderationRes.ok) {
            const modData = await moderationRes.json();
            const results = modData.results[0];

            // If OpenAI flags this as self-harm or violence
            if (results.categories["self-harm"] || results.categories["violence"]) {
                console.warn("CRISIS DETECTED: Triggering safety protocol.");

                return NextResponse.json({
                    transcript: userMessage,
                    reply: "I hear how much pain you are in right now, and I want you to know you don't have to carry this alone. Your life is incredibly valuable.\n\n• 📞 Crisis Hotline: Text or call 988 immediately.\n• 🏫 Campus Support: Please reach out to your University Counseling Center or Campus Security.\n• 💬 AI Conversation: I am still here with you. Let's take a slow, deep breath together.",
                    smile_score: 0,
                    mood: "Crisis",
                    audioBase64: null, 
                });
            }
        }
    } catch (modError) {
        console.error("Moderation API failed, continuing with prompt safety...", modError);
    }
    /* ─────────────────────────────────── */

    /* ─── Build messages for GPT-4o (therapist reply) — using OpenAI SDK ─── */
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: THERAPIST_SYSTEM_PROMPT },
        ...history.slice(-20) as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        { role: "user", content: userMessage },
    ];

    let assistantReply: string;
    try {
        const gptResponse = await client.chat.completions.create({
            model: "gpt-4o", // gpt-4o is significantly better at empathy and tone matching
            messages,
            temperature: 0.6, // Balanced: warm & grounded without rambling
            max_tokens: 400,
        });
        assistantReply = gptResponse.choices[0]?.message?.content || "I'm here with you. Can you tell me more?";
    } catch (gptError: any) {
        console.error("OpenAI SDK error:", gptError?.message ?? gptError);
        return NextResponse.json(
            { error: "GPT response failed", details: gptError?.message },
            { status: 502 }
        );
    }

    /* ─── Smile Score analysis (separate GPT call) ─── */
    let smileScore: number | null = null;
    let detectedMood: string | null = null;

    if (shouldAnalyze) {
        try {
            const analyzeRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gpt-5.4", // 🚀 UPGRADED TO GPT-5.4
                    messages: [
                        { role: "system", content: SMILE_SCORE_PROMPT },
                        { role: "user", content: userMessage },
                    ],
                    temperature: 0.3,
                    max_tokens: 80,
                }),
            });

            if (analyzeRes.ok) {
                const analyzeData = await analyzeRes.json();
                const raw = analyzeData.choices?.[0]?.message?.content || "";
                // Extract JSON from response (handle markdown code blocks too)
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    smileScore = typeof parsed.smile_score === "number"
                        ? Math.max(0, Math.min(100, parsed.smile_score))
                        : null;
                    detectedMood = typeof parsed.mood === "string" ? parsed.mood : null;
                }
            }
        } catch {
            // Non-critical — smile score is optional
        }
    }

    /* ─── TTS: Generate spoken audio of the reply (Using Gemini 2.5 Pro TTS) ─── */
    let audioBase64: string | null = null;

    if (shouldTTS) {
        try {
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

            if (!GEMINI_API_KEY) {
                console.error("GEMINI_API_KEY is missing from .env.local");
            } else {
                // Call Google's Gemini 2.5 Pro Preview TTS API
                const ttsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-tts:generateContent?key=${GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: assistantReply }]
                        }],
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: "Zephyr" // The voice you selected in the AI Studio playground!
                                    }
                                }
                            }
                        }
                    }),
                });

                if (ttsRes.ok) {
                    const ttsData = await ttsRes.json();
                    // Gemini conveniently returns the audio already formatted as a Base64 string
                    audioBase64 = ttsData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
                } else {
                    const errText = await ttsRes.text();
                    console.error("Gemini TTS Failed:", errText);
                }
            }
        } catch (error) {
            console.error("TTS Error:", error);
            // TTS is non-critical — text reply still works if this fails
        }
    }

    /* ─── DALL-E 3: Visual Art Therapy Generation ─── */
    let generatedImageUrl: string | null = null;

    // We only generate an image if we successfully detected a mood to base it on
    if (shouldAnalyze && detectedMood && detectedMood !== "Crisis") {
        try {
            const imageRes = await fetch("https://api.openai.com/v1/images/generations", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "dall-e-3",
                    // We force a specific art style so it matches your app's lofi/journal vibe
                    prompt: `A beautiful, soothing, lofi-aesthetic watercolor illustration representing the feeling of: ${detectedMood}. Soft pastel colors, highly atmospheric, comforting. No text or words in the image.`,
                    n: 1,
                    size: "1024x1024",
                }),
            });

            if (imageRes.ok) {
                const imageData = await imageRes.json();
                generatedImageUrl = imageData.data[0].url;
            }
        } catch (imgError) {
            console.error("Failed to generate art therapy image:", imgError);
        }
    }

    return NextResponse.json({
        transcript: userMessage,
        reply: assistantReply,
        smile_score: smileScore,
        mood: detectedMood,
        audioBase64,
        imageUrl: generatedImageUrl,
    });
}