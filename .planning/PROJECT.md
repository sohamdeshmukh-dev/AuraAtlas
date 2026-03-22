# AuraAtlas

## What This Is

AuraAtlas is a collective emotional intelligence platform for college students. Students anonymously report their mood, and the aggregated sentiment is rendered as a live 3D "emotional skyline" on an interactive campus map — tall red towers for stress, short blue pillars for calm. It includes an AI therapist, campus analytics, AR mood overlays, gamification, and social features.

**Hackathon context:** We are currently competing and need to win by demonstrating real-world practicality and institutional value.

## Core Value

Universities get a real-time early warning system for campus mental health crises — students get an anonymous outlet with AI support — and the data loop between them is what no competitor offers.

## Requirements

### Validated

- ✓ 3D Emotional Skyline (Mapbox fill-extrusion, grid aggregation) — existing
- ✓ Daily mood check-in (6 moods, streak, Smile Score, 24hr lock) — existing
- ✓ AI therapist (GPT-4o chat + Whisper voice + crisis detection) — existing
- ✓ Personal journal (rich entries, images, intensity, location) — existing
- ✓ Campus intelligence (per-college emotion aggregation, privacy redaction) — existing
- ✓ Social features (friends, DMs, leaderboard, real-time chat) — existing
- ✓ AR mode (Three.js + WebXR, building emotion overlays) — existing
- ✓ Aura Points gamification (environmental scanner + OpenAI vision) — existing
- ✓ Supabase auth + RLS + rate limiting + Zod validation — existing
- ✓ Stripe integration (checkout/subscriptions) — existing
- ✓ Resend + React Email (built, not fully wired) — existing

### Active

- [ ] Campus Counselor Dashboard — real-time institutional view for mental health officers
- [ ] Crisis alert → real email (wire crisis detection to Resend → counselor inbox)
- [ ] Real-time map updates (Supabase realtime subscriptions → live skyline animation)
- [ ] Demo mode (seed realistic data, make map alive without real users)
- [ ] Fix onboarding/login flow (current state is skeletal, judges will try it)
- [ ] Weekly mood digest email (wire Resend templates to actual delivery)

### Out of Scope

- Mobile app — web-first for hackathon
- Video generation (Remotion installed, not needed for demo)
- OAuth/social login — Supabase email auth sufficient
- Per-building moderation queue — complexity not worth it for hackathon
- Predictive ML mood forecasting — rule-based approximation is enough

## Context

- **Hackathon** — competing now, demo must work flawlessly in under 5 minutes
- **Teammates** — active on the repo (profile section improved, AR improved per recent commits)
- **Stack**: Next.js 16 App Router, Supabase, Mapbox GL JS 3, Three.js, OpenAI GPT-4o, Resend, Stripe, Tailwind v4, Framer Motion
- **Key file**: `components/Map3DView.tsx` (53.7KB) is the crown jewel — treat with care
- **70+ colleges** pre-loaded, 11 cities, keyboard city navigation

## Constraints

- **Timeline**: Hackathon — hours, not days
- **Tech stack**: Locked — Next.js 16 + Supabase + existing APIs
- **Teammates**: Working concurrently — avoid touching files they're actively editing (profile, AR)
- **Demo**: Must work live — no broken flows, no empty states, no crashes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Counselor Dashboard is highest priority | Reframes from "student app" → "university infrastructure" — institutional B2B angle wins judges | — Pending |
| Build on existing campus API endpoints | `/api/campus/[college_id]/emotions` already aggregates data — no new backend needed | — Pending |
| Supabase realtime for live map | Already using Supabase — zero new deps, built-in channel subscriptions | — Pending |
| Skip research phase | Full codebase already explored — context is complete | ✓ Good |

---
*Last updated: 2026-03-22 after initialization*
