"use client";

import { Mood, MOODS } from "@/lib/types";

interface EmotionIntensitySliderProps {
  emotion: Mood;
  value: number;
  onChange: (nextValue: number) => void;
}

export default function EmotionIntensitySlider({
  emotion,
  value,
  onChange,
}: EmotionIntensitySliderProps) {
  const moodConfig = MOODS.find((mood) => mood.label === emotion);
  const color = moodConfig?.color ?? "#14b8a6";
  const normalized = Math.max(1, Math.min(100, value));
  const progress = ((normalized - 1) / 99) * 100;

  return (
    <div className="space-y-3 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-4">
      <div className="space-y-0.5">
        <p className="text-[11px] uppercase tracking-wider text-[var(--muted-text)] font-medium">Intensity</p>
        <p className="text-sm text-[var(--foreground)]">
          Selected: <span className="font-medium" style={{ color }}>{emotion}</span>
        </p>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min={1}
          max={100}
          value={normalized}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-sm bg-slate-400/50"
          style={{
            background: `linear-gradient(90deg, ${color} 0%, ${color} ${progress}%, rgba(51,65,85,0.85) ${progress}%, rgba(51,65,85,0.85) 100%)`,
            transition: "background 120ms linear",
          }}
          aria-label={`${emotion} intensity`}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--subtle-text)]">1</span>
          <span className="min-w-12 rounded border border-[var(--border-soft)] px-2 py-0.5 text-center text-sm font-medium text-[var(--foreground)] tabular-nums">
            {normalized}
          </span>
          <span className="text-[10px] text-[var(--subtle-text)]">100</span>
        </div>
      </div>
    </div>
  );
}
