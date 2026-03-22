"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, FileText, CalendarDays } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Button from "@/components/Button";
import EmotionIntensitySlider from "@/components/EmotionIntensitySlider";
import ImageUploader from "@/components/ImageUploader";
import JournalEntryCard from "@/components/JournalEntryCard";
import LocationPicker from "@/components/LocationPicker";
import MoodBalanceGraph from "@/components/MoodBalanceGraph";
import MoodWheel from "@/components/MoodWheel";
import StatsCard from "@/components/StatsCard";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useLocation } from "@/hooks/useLocation";
import { useMoodEntry } from "@/hooks/useMoodEntry";
import { markDailyCheckInCompleted } from "@/hooks/useDailyCheckIn";
import { Mood, MOODS } from "@/lib/types";

const DEFAULT_INTENSITY = 40;

function getLocalDateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function calculateStreak(createdAts: string[]) {
  if (createdAts.length === 0) {
    return 0;
  }

  const daysWithEntries = new Set(createdAts.map((value) => getLocalDateKey(value)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;

  for (let dayOffset = 0; dayOffset < 365; dayOffset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - dayOffset);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (daysWithEntries.has(key)) {
      streak += 1;
    } else if (dayOffset > 0) {
      break;
    }
  }

  return streak;
}

export default function JournalPage() {
  const [feelingNow, setFeelingNow] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState<Mood | null>(null);
  const [moodInfluence, setMoodInfluence] = useState("");
  const [intensity, setIntensity] = useState(DEFAULT_INTENSITY);
  const [needRightNow, setNeedRightNow] = useState("");
  const [note, setNote] = useState("");
  const [weekThreshold] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [communityPulse, setCommunityPulse] = useState<{ dominant_mood: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [savedMood, setSavedMood] = useState<Mood | null>(null);
  const [savedIntensity, setSavedIntensity] = useState(DEFAULT_INTENSITY);

  useEffect(() => {
    supabase.from('community_mood_pulse').select('*').limit(1).maybeSingle().then(({ data, error }) => {
      if (data && !error) setCommunityPulse(data);
    });
  }, []);

  const { entries, isLoading, isSaving, saveError, saveSuccess, deletingId, saveEntry, deleteEntry } = useMoodEntry();
  const { file, previewUrl, isUploading, uploadError, selectFile, clearImage, uploadImage } = useImageUpload();
  const {
    value: location,
    suggestions,
    isSearching,
    isLocating,
    error: locationError,
    setLocationValue,
    selectSuggestion,
    useCurrentLocation,
    clearLocation,
  } = useLocation();

  const selectedMood = useMemo(
    () => MOODS.find((mood) => mood.label === selectedEmotion),
    [selectedEmotion]
  );

  const totalEntries = entries.length;
  const streak = useMemo(
    () => calculateStreak(entries.map((entry) => entry.createdAt)),
    [entries]
  );
  const thisWeekCount = useMemo(() => {
    return entries.filter((entry) => new Date(entry.createdAt).getTime() >= weekThreshold).length;
  }, [entries, weekThreshold]);
  const isDailyCheckInComplete = Boolean(
    selectedEmotion &&
    feelingNow.trim() &&
    moodInfluence.trim() &&
    needRightNow.trim()
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedFeelingNow = feelingNow.trim();
    const trimmedMoodInfluence = moodInfluence.trim();
    const trimmedNeedRightNow = needRightNow.trim();

    if (!selectedEmotion || !trimmedFeelingNow || !trimmedMoodInfluence || !trimmedNeedRightNow) {
      return;
    }

    const structuredResponses = [
      `Q1. How are you feeling right now?\n${trimmedFeelingNow}`,
      `Q2. What emotion best describes your current state?\n${selectedEmotion}`,
      `Q3. What influenced your mood today?\n${trimmedMoodInfluence}`,
      `Q4. How intense is this feeling?\n${Math.round(intensity)}/100`,
      `Q5. What is one thing you need right now?\n${trimmedNeedRightNow}`,
    ];

    const trimmedNote = note.trim();
    if (trimmedNote) {
      structuredResponses.push(`Additional reflection\n${trimmedNote}`);
    }

    const journalText = structuredResponses.join("\n\n").slice(0, 1000);

    let imageUrl: string | undefined;

    if (file) {
      const uploaded = await uploadImage();
      if (!uploaded) {
        return;
      }
      imageUrl = uploaded;
    }

    const didSave = await saveEntry({
      emotion: selectedEmotion,
      intensity,
      note: journalText,
      imageUrl,
      location: location.trim() ? location.trim() : undefined,
    });

    if (!didSave) {
      return;
    }

    // Trigger the Journal Email!
    fetch('/api/send-journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "balajipratik8@gmail.com",
        mood: selectedEmotion || "Reflective",
        streak: streak + 1,
        totalEntries: totalEntries + 1
      })
    }).catch(err => console.error("Journal email failed", err));

    markDailyCheckInCompleted();
    setSavedMood(selectedEmotion);
    setSavedIntensity(intensity);
    setShowModal(true);

    setFeelingNow("");
    setSelectedEmotion(null);
    setMoodInfluence("");
    setIntensity(DEFAULT_INTENSITY);
    setNeedRightNow("");
    setNote("");
    clearImage();
    clearLocation();
  }

  const isBusy = isSaving || isUploading;

  return (
    <div className="min-h-screen bg-[var(--background)] page-enter">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-6">
        <section className="py-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Mood Journal
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-text)]">Record and review your emotional patterns over time.</p>
        </section>

        <section className="py-6">
          <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-5">
                <h2 className="text-base font-semibold text-[var(--foreground)]">Daily Entry</h2>
                <p className="mt-1 text-xs text-[var(--muted-text)]">Complete all 5 fields to submit your mood log.</p>
              </div>

              <div className="space-y-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-5">
                <label className="text-sm font-medium text-[var(--foreground)]">1. Current state</label>
                <input
                  value={feelingNow}
                  onChange={(event) => setFeelingNow(event.target.value)}
                  placeholder="Briefly describe how you feel right now."
                  maxLength={160}
                  className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--subtle-text)] outline-none transition-colors focus:border-slate-400"
                  required
                />
                <p className="text-right text-[11px] text-[var(--subtle-text)] tabular-nums">{feelingNow.length}/160</p>
              </div>

              <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-5">
                <label className="text-sm font-medium text-[var(--foreground)]">2. Primary emotion</label>
                <p className="mt-0.5 text-xs text-[var(--muted-text)]">Select from the wheel below.</p>
                <div className="mt-4">
                  <MoodWheel value={selectedEmotion} onChange={setSelectedEmotion} />
                </div>
              </div>

              {selectedEmotion ? (
                <div className="space-y-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-5">
                  <label className="text-sm font-medium text-[var(--foreground)]">4. Intensity level (1-100)</label>
                  <EmotionIntensitySlider
                    emotion={selectedEmotion}
                    value={intensity}
                    onChange={setIntensity}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[var(--border-soft)] bg-[var(--surface-2)] p-5 text-sm text-[var(--muted-text)]">
                  Intensity selection requires an emotion in field 2.
                </div>
              )}

              <div className="space-y-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-5">
                <label className="text-sm font-medium text-[var(--foreground)]">3. Contributing factors</label>
                <textarea
                  value={moodInfluence}
                  onChange={(event) => setMoodInfluence(event.target.value)}
                  placeholder="Events, thoughts, or interactions that influenced your mood."
                  rows={3}
                  maxLength={320}
                  required
                  className="w-full resize-none rounded-md border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--subtle-text)] outline-none transition-colors focus:border-slate-400"
                />
                <p className="text-right text-[11px] text-[var(--subtle-text)] tabular-nums">{moodInfluence.length}/320</p>
              </div>

              <div className="space-y-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-5">
                <label className="text-sm font-medium text-[var(--foreground)]">5. Immediate need</label>
                <input
                  value={needRightNow}
                  onChange={(event) => setNeedRightNow(event.target.value)}
                  placeholder="Rest, support, clarity, connection, movement, etc."
                  maxLength={180}
                  required
                  className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--subtle-text)] outline-none transition-colors focus:border-slate-400"
                />
                <p className="text-right text-[11px] text-[var(--subtle-text)] tabular-nums">{needRightNow.length}/180</p>
              </div>

              <div className="space-y-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-5">
                <label className="text-sm font-medium text-[var(--foreground)]">Additional notes <span className="font-normal text-[var(--muted-text)]">(optional)</span></label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Any additional context or reflections."
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-md border border-[var(--border-soft)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--subtle-text)] outline-none transition-colors focus:border-slate-400"
                />
                <p className="text-right text-[11px] text-[var(--subtle-text)] tabular-nums">{note.length}/500</p>
              </div>

              <ImageUploader
                file={file}
                previewUrl={previewUrl}
                isUploading={isUploading}
                uploadError={uploadError}
                onSelectFile={selectFile}
              />

              <LocationPicker
                value={location}
                suggestions={suggestions}
                isLocating={isLocating}
                isSearching={isSearching}
                error={locationError}
                onUseCurrentLocation={useCurrentLocation}
                onChange={setLocationValue}
                onSelectSuggestion={selectSuggestion}
              />

              {(selectedEmotion === "Overwhelmed" || selectedEmotion === "Sad") && (
                <div className="rounded-lg border border-red-500/25 bg-red-500/[0.06] p-4 text-center">
                  <p className="text-sm font-medium text-red-300">Support is available if you need it.</p>
                  <a
                    href="tel:988"
                    className="mt-2 inline-flex rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/20"
                  >
                    988 Crisis Lifeline
                  </a>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  type="submit"
                  isLoading={isBusy}
                  disabled={!isDailyCheckInComplete || isBusy}
                  className="w-full"
                >
                  Submit Entry
                </Button>
                {isUploading ? <p className="text-xs text-slate-400">Uploading image...</p> : null}
                {isSaving ? <p className="text-xs text-slate-400">Saving...</p> : null}
                {saveSuccess ? <p className="text-xs font-medium text-emerald-400">Entry recorded.</p> : null}
                {saveError ? <p className="text-xs text-red-400">{saveError}</p> : null}
                {!isDailyCheckInComplete && !isBusy ? (
                  <p className="text-xs text-slate-400">All required fields must be completed.</p>
                ) : null}
              </div>
            </form>

            <aside className="space-y-4">
              <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-5">
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Summary</h2>
                <p className="mt-0.5 text-[11px] text-[var(--subtle-text)]">Logging consistency at a glance.</p>
                <div className="mt-4 grid gap-3">
                  <StatsCard
                    label="Consistency"
                    value={`${streak}d`}
                    icon={<Activity className="h-3.5 w-3.5" />}
                    helperText="Consecutive days logged"
                  />
                  <StatsCard
                    label="Total Entries"
                    value={totalEntries}
                    icon={<FileText className="h-3.5 w-3.5" />}
                    helperText="All recorded entries"
                  />
                  <StatsCard
                    label="Last 7 Days"
                    value={thisWeekCount}
                    icon={<CalendarDays className="h-3.5 w-3.5" />}
                    helperText="Entries this week"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-5">
                <p className="text-[11px] uppercase tracking-wider text-[var(--muted-text)] font-medium">Active Selection</p>
                <div className="mt-2.5 flex items-center gap-3">
                  {selectedMood ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: `${selectedMood.color}20` }}>
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedMood.color }} />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--surface-2)]">
                      <div className="h-3 w-3 rounded-full bg-slate-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {selectedEmotion ?? "None"}
                    </p>
                    <p className="text-[11px] text-[var(--muted-text)]">
                      {selectedEmotion
                        ? `Intensity: ${intensity}/100`
                        : "Select an emotion to continue."}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="py-10">
          <MoodBalanceGraph entries={entries} />
        </section>

        <section className="pb-8">
          <div className="grid md:grid-cols-2 gap-0 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] overflow-hidden">
            <div className="p-5 space-y-1.5">
              <h3 className="text-[11px] uppercase tracking-wider text-[var(--muted-text)] font-medium">Personal Trend</h3>
              {(() => {
                const isHighIntensityStreak = entries.length >= 2 && entries[0].intensity > 70 && entries[1].intensity > 70;
                const isRecoveryForecast = entries.length >= 1 && entries[0].emotion === 'Calm';

                if (isHighIntensityStreak) {
                  return <p className="text-sm text-[var(--foreground)]">Elevated intensity detected across recent entries. Consider monitoring for sustained stress.</p>;
                } else if (isRecoveryForecast) {
                  return <p className="text-sm text-[var(--foreground)]">Recent entries indicate stabilization. Current state favors reflective activities.</p>;
                } else {
                  return <p className="text-sm text-[var(--foreground)]">Emotional balance within normal range. Continue logging to build a more complete picture.</p>;
                }
              })()}
            </div>
            <div className="p-5 space-y-1.5 border-t border-[var(--border-soft)] md:border-t-0 md:border-l">
              <h3 className="text-[11px] uppercase tracking-wider text-[var(--muted-text)] font-medium">User Trends</h3>
              {communityPulse ? (() => {
                return (
                  <p className="text-sm text-[var(--foreground)] leading-relaxed">
                    Dominant reported mood across users: <strong>{communityPulse.dominant_mood}</strong>.
                  </p>
                );
              })() : (
                <p className="text-sm text-[var(--muted-text)]">Aggregating user data...</p>
              )}
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Entry Log</h2>
            <p className="mt-0.5 text-sm text-[var(--subtle-text)]">Chronological record of mood entries.</p>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-10 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-400" />
              <p className="mt-3 text-sm text-[var(--muted-text)]">Loading entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-10 text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">No entries recorded.</p>
              <p className="mt-1 text-sm text-[var(--subtle-text)]">
                Submit your first mood log to begin tracking.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {entries.map((entry) => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry}
                  isDeleting={deletingId === entry.id}
                  onDelete={deleteEntry}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {showModal && savedMood && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowModal(false)}
          >
            <div className="w-full max-w-md bg-[var(--surface-1)] border border-[var(--border-soft)] p-8 rounded-lg text-center" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4">
                <div className="mx-auto h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${MOODS.find(m => m.label === savedMood)?.color ?? '#14b8a6'}20` }}>
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: MOODS.find(m => m.label === savedMood)?.color ?? '#14b8a6' }} />
                </div>
              </div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-lg font-semibold text-[var(--foreground)] mb-1">Entry Recorded</p>
                <p className="text-sm text-[var(--muted-text)] mb-6">
                  {savedMood} logged at intensity {savedIntensity}. Your data has been saved.
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button onClick={() => setShowModal(false)} className="px-6">
                  Continue
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
