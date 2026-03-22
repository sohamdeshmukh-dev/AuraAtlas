# AuraAtlas — Hackathon TODO & Strategy

> **Last updated**: 2026-03-22
> **Goal**: Place 1st by demonstrating real-world practicality and institutional value.
> **Winning narrative**: AuraAtlas is not a student mood tracker — it is **mental health infrastructure for universities**.

---

## Project State Summary

AuraAtlas is a collective emotional intelligence platform for college students. It is **not a prototype** — it is a functional product with 10 major features, 27 API routes, 3 database migrations, and production-grade security. The 3D emotional skyline, AI therapist, campus analytics, AR, gamification, and social graph are all built and working.

### What's Built ✅

| Feature | Status | Key Files |
|---------|--------|-----------|
| 3D Emotional Skyline (Mapbox fill-extrusion) | ✅ Working | `components/Map3DView.tsx`, `lib/gridAggregator.ts` |
| Daily Mood Check-In (6 moods, streak, Smile Score) | ✅ Working | `components/DailyCheckInModal.tsx`, `app/api/checkins/` |
| AI Therapist (GPT-4o chat + Whisper voice) | ✅ Working | `app/ai-therapist/page.tsx`, `app/api/therapist/route.ts` |
| Crisis Detection (flags self-harm language → 988) | ✅ Working | `app/api/therapist/route.ts` |
| Personal Journal (rich entries, images, intensity) | ✅ Working | `app/journal/page.tsx`, `app/api/journal/route.ts` |
| Campus Intelligence Dashboard | ✅ Working | `components/CampusLayer.tsx`, `app/api/campus/` |
| Social Features (friends, DMs, leaderboard) | ✅ Working | `app/friends/page.tsx`, `components/FloatingChat.tsx` |
| Augmented Reality (Three.js + WebXR) | ✅ Working | `app/ar/page.tsx`, `components/ar/ARScene.tsx` |
| Aura Points Gamification (env scanner + OpenAI vision) | ✅ Working | `components/AuraPointsScanner.tsx` |
| Emotion Weather Overlay (mood → weather animation) | ✅ Working | `components/EmotionWeatherOverlay.tsx` |
| Stripe Payments (checkout + subscriptions) | ✅ Built | `app/api/stripe/checkout/route.ts` |
| Resend Email (React Email templates) | ✅ Built, not wired | `emails/`, `app/api/send-email/route.ts` |
| Supabase Auth + RLS | ✅ Working | `lib/supabase.ts`, all API routes |
| Rate Limiting + Zod validation | ✅ Working | `lib/rate-limit.ts`, all API routes |

---

## Priority TODO List

### 🔴 P0 — Critical for Demo (Do These First)

- [ ] **Fix onboarding/login flow**
  - The login and onboarding directories are skeletal
  - A judge who tries to sign up and hits a broken flow = instant loss
  - Target: signup → college auto-detection → first check-in in under 60 seconds
  - Files: `app/login/`, `app/onboarding/`

- [ ] **Seed demo data / Demo Mode toggle**
  - The 3D skyline only looks impressive with real data
  - Add a "LIVE DEMO" toggle on the main dashboard that seeds realistic mood check-ins across the map in real-time
  - Moods should *appear* on the skyline as you watch (combine with real-time below)
  - Files: `app/page.tsx`, new `app/api/dev/seed/route.ts`

- [ ] **Real-time map updates via Supabase realtime**
  - Currently the map refreshes on load — make it animate live
  - Subscribe to new check-ins with `supabase.channel()` and update the skyline dynamically
  - This alone could be the demo showstopper
  - Files: `components/Map3DView.tsx`

---

### 🟠 P1 — Highest Hackathon Impact (Winning Features)

- [ ] **Campus Counselor Dashboard** (`/counselor`) — *THE KEY DIFFERENTIATOR*
  - This is the institutional B2B angle. Shows judges AuraAtlas is infrastructure, not just an app.
  - What to show:
    - Real-time campus mood index with crisis threshold alerts (e.g., mood drops 30%+ in 24h = red alert)
    - "Finals Week Stress Spike" auto-detection
    - Which buildings/zones are highest-stress (connect to AR building data)
    - Peer support network health (are students connecting with friends?)
    - Historical trend: "This campus has been 23% more stressed since midterms"
    - Anonymized aggregate data only — zero PII exposed
  - Market framing: Universities spend $500M+/year on mental health. No competitor (Headspace, Calm, BetterHelp) offers counselors real-time, privacy-safe early warning signals.
  - Files: New `app/counselor/page.tsx`, reuse existing `app/api/campus/` endpoints

- [ ] **Crisis Alert → Real Email via Resend**
  - You already detect crisis language in the AI therapist. Wire it to action.
  - When a student expresses suicidal ideation:
    1. Student receives immediate in-app 988 prompt (already built ✅)
    2. System sends anonymized alert to `counseling@[university].edu` (NEW)
    3. No PII — just "A student at [College Name] may need support. Time: [timestamp]"
  - This is the feature that makes judges go silent. It's a life-safety system.
  - Files: `app/api/therapist/route.ts`, new email template in `emails/`

- [ ] **Weekly Mood Digest Email**
  - Wire the existing Resend + React Email setup to actually send emails
  - Content: Smile Score trend, streak, most-felt emotions this week, campus comparison, one AI-generated insight
  - Trigger: Can be manual for demo (button in profile), or cron-based
  - Shows the full product loop: data in → insight out → email delivery
  - Files: `emails/`, `app/api/send-email/route.ts`, `app/profile/page.tsx`

---

### 🟡 P2 — Polish & Completeness

- [ ] **Mobile UX audit**
  - Judges often judge on phones
  - Test 3D map, check-in modal, and therapist chat on mobile
  - Reduce JavaScript load where possible (heavy Three.js + Mapbox on mobile)

- [ ] **Empty state handling**
  - If a new user sees an empty map, empty journal, no campus data — add beautiful empty states with CTAs
  - "Be the first to check in at your campus" CTA on empty map

- [ ] **Error boundaries**
  - Wrap Map3DView, ARScene, and FloatingChat in React error boundaries
  - A crash during a demo = game over

- [ ] **Loading states**
  - Add skeleton loaders for campus dashboard, friends list, and therapist chat
  - Ensure no blank white flashes during page transitions

- [ ] **Stripe payment flow verification**
  - End-to-end test the checkout flow
  - Make sure "Pro" tier unlocks something visible (analytics history, unlimited journal, etc.)

---

### 🟢 P3 — Nice to Have (If Time Allows)

- [ ] **Shareable Aura Card**
  - Generate a shareable image card showing your Smile Score, dominant mood, and streak
  - "Share your Aura" → downloadable PNG or link
  - Great for social media spread + demo wow factor
  - Could use Remotion (already installed) or Satori for OG image generation

- [ ] **Mood Forecast**
  - ML-lite: "Based on your pattern, you may feel stressed this Thursday (finals week)"
  - Can be rule-based (historical weekly patterns) — doesn't need true ML

- [ ] **AR Building Dataset Expansion**
  - Currently hardcoded to UVA buildings (`lib/uvaBuildings.ts`)
  - Add at least 2–3 more campuses for the demo

- [ ] **Research Data Export** (for the counselor dashboard)
  - IRB-compliant anonymized CSV export of aggregate mood trends
  - Shows the research/academic partnership angle

- [ ] **Dev Dashboard** (`/dev-dashboard`)
  - Wire up the existing dev dashboard directory
  - Useful for showing judges the "admin view"

---

## Tech Stack Reference

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript, `proxy.ts`) |
| Database | Supabase (PostgreSQL + RLS + Realtime) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS v4 + Framer Motion 12 |
| Maps | Mapbox GL JS 3.x (3D skyline) + Leaflet (heatmap) |
| 3D / AR | Three.js + @react-three/fiber + @react-three/xr |
| AI Chat | OpenAI GPT-4o + Whisper |
| AI Vision | OpenAI Vision API (AR building ID) |
| Charts | Recharts |
| Email | Resend + React Email |
| Payments | Stripe |
| Video | Remotion |
| Validation | Zod v4 |
| Notifications | react-hot-toast |

---

## Project Structure (Quick Reference)

```
app/
├── page.tsx              # Main dashboard (3D map) — START HERE for demo
├── ai-therapist/         # AI therapy chat
├── journal/              # Mood journal + history
├── friends/              # Social graph + DMs
├── profile/              # User settings + Smile Score
├── report/               # Analytics dashboard
├── ar/                   # AR mode
├── login/                # Auth (NEEDS POLISH)
├── onboarding/           # Onboarding (NEEDS POLISH)
├── counselor/            # ← TODO: BUILD THIS (counselor dashboard)
└── api/                  # 27 route handlers

components/               # 60+ components (flat structure)
lib/                      # Utilities, types, Supabase client
hooks/                    # Custom React hooks
emails/                   # React Email templates (NEEDS WIRING)
```

---

## Pitch Framing for Judges

### The Problem
College mental health is in crisis. Campus counseling centers are overwhelmed, wait times for appointments are 2–6 weeks, and counselors have no visibility into campus-wide stress patterns until it's too late.

### The Solution
AuraAtlas gives students a private, anonymous outlet and gives counselors the aggregate intelligence to act proactively — before crises escalate.

### Why It Wins
1. **Students get**: anonymous mood check-ins, AI therapist (immediate access), AR campus exploration, friend support network, gamified wellness
2. **Counselors get**: real-time campus mood dashboard, crisis spike alerts, trend data, zero PII
3. **Universities get**: early warning system, student engagement data, potential research pipeline
4. **No competitor does all three** — Headspace/Calm are consumer-only, BetterHelp is therapist-matching, Crisis Text Line is reactive

### Key Differentiators to Highlight in Demo
- The 3D emotional skyline is visually unlike anything else
- Crisis detection → real counselor alert is a life-safety feature
- Campus-specific intelligence (not just generic mood tracking)
- Anonymous-by-default with institutional-grade privacy redaction
- AR mode for physical campus exploration

---

## Demo Script (Suggested Flow)

1. **Open map** → show 3D skyline breathing with campus mood data
2. **Do a check-in** → watch your check-in appear on the map in real-time (P0 feature)
3. **Open AI therapist** → show crisis detection + 988 integration
4. **Switch to Counselor Dashboard** (P1 feature) → show aggregate crisis alerts
5. **Show AR mode** → point camera at a building, see emotion overlay
6. **Show profile** → Smile Score, streak, Aura Points
7. **Mention email digest** → "every week, students get a personalized wellness report"

---

## Known Issues / Bugs to Fix

- [ ] Onboarding flow is skeletal — users dropped into empty state after signup
- [ ] AR scene must be dynamically imported (SSR incompatible — already done via dynamic import, verify)
- [ ] Map requires Mapbox token in `.env.local` — make sure it's set in all environments
- [ ] Colleges table fallback: if table doesn't exist, uses `lib/collegeList.ts` — verify fallback works
- [ ] Hydration mismatch on localStorage reads — fixed in commit b84bc6b, verify it didn't regress
- [ ] FloatingChat.tsx is 58KB — check if it causes CLS or slow render on mobile
- [ ] Stripe: verify webhook secret is configured for payment confirmation

---

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (Therapist + Vision + Whisper)
OPENAI_API_KEY=

# Mapbox (3D Map)
NEXT_PUBLIC_MAPBOX_TOKEN=

# Resend (Email)
RESEND_API_KEY=

# Stripe (Payments)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Google Gemini (alternative AI)
GOOGLE_GENERATIVE_AI_API_KEY=
```

---

## Contribution Notes

- All components are flat in `components/` — no nested folders
- Use Server Components by default; only add `'use client'` when needed
- All async request APIs: `await cookies()`, `await headers()`, `await params`
- Use `proxy.ts` at project root (not `middleware.ts`)
- Supabase client via `lib/supabase.ts` — SSR helpers for server components
- Server Actions for mutations; Route Handlers only for public APIs/webhooks
- Rate limit sensitive endpoints (`lib/rate-limit.ts`)
- Validate all inputs with Zod before processing
