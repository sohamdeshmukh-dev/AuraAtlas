# AuraAtlas — Hackathon Roadmap

**Milestone:** Hackathon Win
**Phases:** 3
**Requirements:** 16 v1 requirements
**Strategy:** Ship highest-impact features first. Phase 1 makes the demo solid. Phase 2 is the judge wow moment. Phase 3 closes the product loop.

---

## Milestone 1: Hackathon Win

### Phase 1: Demo Stability + Real-Time Map

**Goal:** The demo never fails. Map looks alive with real-time data for any judge who walks up.

**Requirements:** DEMO-01, DEMO-02, DEMO-03, RT-01, RT-02

**Success criteria:**
1. A new user can sign up, get college detected, and submit first check-in in under 60 seconds
2. The 3D skyline shows realistic mood data immediately (demo mode seed)
3. When a new check-in is submitted, the corresponding skyline column updates within 3 seconds without refresh
4. No crashes, blank pages, or broken flows on any route

**Key files:**
- `app/login/`, `app/onboarding/` — fix onboarding flow
- `components/Map3DView.tsx` — add Supabase realtime subscription
- New `app/api/dev/seed/route.ts` — demo data seeding endpoint
- `app/page.tsx` — demo mode toggle UI

**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Fix login page auth flow and rewrite onboarding with full college list
- [ ] 01-02-PLAN.md — Create demo seed endpoint and add demo mode toggle to dashboard HUD
- [ ] 01-03-PLAN.md — Wire Supabase realtime to Map3DView for live skyline updates

---

### Phase 2: Campus Counselor Dashboard

**Goal:** `/counselor` is a fully functional institutional dashboard showing university mental health officers what's happening on their campus in real time. This is the feature that wins the hackathon.

**Requirements:** COUN-01, COUN-02, COUN-03, COUN-04, COUN-05, COUN-06

**Success criteria:**
1. `/counselor` loads with a list of all campuses and their current mood index
2. A campus with mood below threshold shows a visible crisis alert indicator
3. Mood trend chart shows 24h / 7d data per campus
4. Participant count shown (anonymized, redacted if <5)
5. The page tells a clear story: "This campus is in distress, act now"

**Key files:**
- New `app/counselor/page.tsx` — dashboard UI
- Reuse `app/api/campus/[college_id]/emotions/route.ts` — existing aggregation
- Reuse `app/api/colleges/route.ts` — existing college list

---

### Phase 3: Crisis Email + Mood Digest

**Goal:** Wire the Resend email integration to two real workflows: crisis alerts to counselors, and weekly mood digests to students. Closes the product loop and demonstrates end-to-end data flow.

**Requirements:** CRISIS-01, CRISIS-02, CRISIS-03, EMAIL-01, EMAIL-02

**Success criteria:**
1. When therapist detects crisis language, an email is dispatched to the configured counselor address
2. Crisis email contains zero student PII — only timestamp, college name, and signal type
3. 988 in-app prompt appears immediately for the student
4. User can click "Email me my report" in profile and receive a formatted digest within 60 seconds
5. Digest email shows Smile Score, streak, dominant mood, campus comparison

**Key files:**
- `app/api/therapist/route.ts` — add crisis email trigger
- New `emails/CrisisAlert.tsx` — React Email template
- New `emails/MoodDigest.tsx` — React Email template (may already exist)
- `app/profile/page.tsx` — add "Send Report" button
- `app/api/send-email/route.ts` — wire digest endpoint

---

## Phase Order Rationale

| Phase | Why this order |
|-------|---------------|
| 1 first | A broken demo kills everything — stability before features |
| 2 second | Counselor dashboard is the single highest-impact addition — needs stable base |
| 3 third | Email closes the loop — impressive but secondary to the dashboard |
