# AuraAtlas — CLAUDE.md

## Project Overview

AuraAtlas is a mental health & mood tracking platform built with Next.js 16, Supabase, Mapbox/Leaflet, Three.js, and Stripe. It features mood check-ins, AI therapy chat (Gemini), journaling, campus sentiment mapping, AR experiences, friend connections, and email notifications via Resend.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update this file with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for this project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to tasks/todo.md with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to tasks/todo.md
6. **Capture Lessons**: Update CLAUDE.md after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Only touch what's necessary. No side effects with new bugs.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components, `proxy.ts`)
- **Auth & DB**: Supabase (auth, postgres, SSR client via `@supabase/ssr`)
- **Styling**: Tailwind CSS v4, Framer Motion for animations
- **Maps**: Mapbox GL + Leaflet + react-leaflet (dual map system)
- **3D/AR**: Three.js via @react-three/fiber, @react-three/drei, @react-three/xr
- **AI**: Google Generative AI (Gemini) for therapist chat
- **Payments**: Stripe (checkout, subscriptions)
- **Email**: Resend + React Email
- **Video**: Remotion for video generation
- **Charts**: Recharts for mood visualizations
- **Validation**: Zod v4

## Project Structure

```
app/                    # Next.js 16 App Router pages
  api/                  # Route handlers (API endpoints)
  ai-therapist/         # AI therapy chat page
  ar/                   # AR experience page
  journal/              # Journaling pages
  friends/              # Social/friends features
  profile/              # User profile
  report/               # Mood reports
  login/                # Auth flow
  onboarding/           # New user onboarding
  dev-dashboard/        # Developer dashboard
components/             # React components (flat structure)
lib/                    # Utilities, types, Supabase client, data helpers
hooks/                  # Custom React hooks
utils/                  # Additional utilities
emails/                 # React Email templates
remotion/               # Remotion video compositions
public/                 # Static assets
supabase_*.sql          # Database migration files
```

## Key Conventions

- All request APIs are async: `await cookies()`, `await headers()`, `await params`
- Use `proxy.ts` at project root (not `middleware.ts`) for request interception
- Supabase client created via `lib/supabase.ts` — use SSR helpers for server components
- Components are flat in `components/` — no nested folders
- Environment variables: Supabase, Mapbox, Stripe, Resend, Gemini API keys in `.env.local`
- Prefer Server Components by default; only add `'use client'` when needed
- Push `'use client'` boundaries as far down the component tree as possible
- Use Server Actions for mutations, Route Handlers only for public APIs/webhooks

## Lessons Learned

<!-- Add lessons here as corrections happen -->
