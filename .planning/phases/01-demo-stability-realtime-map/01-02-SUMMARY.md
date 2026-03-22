# 01-02 Summary — Demo Seed Endpoint + Dashboard Button

## What was built

### `app/api/dev/seed/route.ts`
- POST endpoint using Supabase service role key (falls back to anon key if missing)
- Inserts 50 synthetic check-ins across Philadelphia, New York City, Los Angeles, Chicago, Houston
- Weighted mood distribution: ~30% Happy/Calm, ~25% Neutral, ~25% Stressed, ~20% Sad/Overwhelmed
- Idempotent: deletes all rows with `anonymous_message = 'DEMO_SEED'` before inserting
- Returns `{ inserted: 50, message: "Demo data seeded successfully" }`

### `app/page.tsx` additions
- `isSeeding` state to disable button while in-flight
- `handleSeedDemo` — calls POST /api/dev/seed, then awaits fetchCheckins() to refresh map
- Demo button in bottom-right controls (near RotateCw spin button): indigo-accented pill button
- `handleCheckInComplete` now calls `fetchCheckins()` for immediate local map refresh

## Seed data shape
- `city`: one of 5 cities, cycled across 50 rows
- `mood`: weighted random from Mood union type
- `lat/lng`: random within each city's bounding box
- `campus_name`: picked from 3–4 campuses per city
- `user_id`: `00000000-0000-0000-0000-000000000001` (demo user, no auth)
- `anonymous_message`: `DEMO_SEED` (idempotency filter)
- `created_at`: spread over last 24 hours

## Edge cases
- Actual Moods are `Happy | Calm | Neutral | Stressed | Sad | Overwhelmed` (plan listed different labels — corrected)
- New York City key in CITY_DATA matches `city.name` used by the checkins API
