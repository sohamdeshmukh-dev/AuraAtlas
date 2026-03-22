"use client";

import { useMemo, useState } from "react";
import { Mood, MOODS } from "@/lib/types";

interface EmotionWheelSelectorProps {
  value: Mood | null;
  onChange: (mood: Mood) => void;
}

const GRID_ORDER: Mood[] = [
  "Calm",
  "Happy",
  "Neutral",
  "Sad",
  "Overwhelmed",
  "Stressed",
];

export default function EmotionWheelSelector({
  value,
  onChange,
}: EmotionWheelSelectorProps) {
  const moods = useMemo(
    () =>
      GRID_ORDER.flatMap((label) => {
        const mood = MOODS.find((m) => m.label === label);
        return mood ? [mood] : [];
      }),
    []
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {moods.map((mood) => {
          const isSelected = value === mood.label;
          return (
            <button
              key={mood.label}
              type="button"
              onClick={() => onChange(mood.label)}
              aria-label={`Select ${mood.label}`}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-center transition-colors ${
                isSelected
                  ? "border-teal-600 bg-teal-600/10 text-[var(--foreground)]"
                  : "border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--muted-text)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <span className="text-xl">{mood.icon}</span>
              <span className="text-xs font-medium">{mood.label}</span>
            </button>
          );
        })}
      </div>
      {value && (
        <p className="text-center text-xs text-[var(--muted-text)]">
          Selected: <span className="font-medium text-[var(--foreground)]">{value}</span>
        </p>
      )}
    </div>
  );
}
