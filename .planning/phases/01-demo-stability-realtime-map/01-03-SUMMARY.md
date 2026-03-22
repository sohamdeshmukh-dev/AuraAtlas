# 01-03 Summary — Realtime Map Subscription

## What was built

### `components/Map3DView.tsx`
- Added `onNewCheckin?: () => void` to `Map3DViewProps` interface
- Destructured in function signature
- New `useEffect` subscribes to `checkins-live` channel on mount:
  ```ts
  supabase.channel('checkins-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkins' }, () => onNewCheckin?.())
    .subscribe()
  ```
- Cleanup via `supabase.removeChannel(channel)` on unmount — prevents duplicate subscriptions on hot reload
- Dependency array `[onNewCheckin]` ensures subscription recreates if callback reference changes

### `app/page.tsx`
- `handleNewCheckin` created with `useCallback([fetchCheckins])` — stable reference for dep array
- Passed as `onNewCheckin={handleNewCheckin}` to `Map3DView`
- `handleCheckInComplete` updated to call `fetchCheckins()` for immediate local refresh after modal close

## Two refresh paths
1. **Realtime subscription** — any INSERT by any user triggers within ~1–3s
2. **Direct refresh** — `handleCheckInComplete` calls `fetchCheckins()` immediately after the current user's modal closes

## Issues / notes
- Supabase realtime requires the `checkins` table to have replication enabled (enabled by default in new Supabase projects)
- No changes to Mapbox fill-extrusion logic — it already reads from the `checkins` prop passed from `app/page.tsx`
