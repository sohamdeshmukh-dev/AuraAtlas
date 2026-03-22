"use client";

import { useMemo, useState } from "react";
import { MapPin, Clock } from "lucide-react";
import { JournalEntry } from "@/lib/journal";
import { MOODS } from "@/lib/types";
import Button from "@/components/Button";

interface JournalEntryCardProps {
  entry: JournalEntry;
  isDeleting: boolean;
  onDelete: (id: string) => void;
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function JournalEntryCard({ entry, isDeleting, onDelete }: JournalEntryCardProps) {
  const moodConfig = useMemo(() => MOODS.find((mood) => mood.label === entry.emotion), [entry.emotion]);
  const [isExpanded, setIsExpanded] = useState(false);
  const note = entry.note?.trim() ?? "";
  const isLongNote = note.length > 180;
  const noteToShow = !isExpanded && isLongNote ? `${note.slice(0, 180).trimEnd()}...` : note;

  return (
    <article className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-4 transition-colors hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: moodConfig?.color ?? "#a78bfa" }} />
            <p className="text-sm font-medium text-[var(--foreground)]">
              {entry.emotion}
            </p>
            <span className="rounded border border-[var(--border-soft)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-text)] tabular-nums">
              {entry.intensity}/100
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[var(--subtle-text)]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimestamp(entry.createdAt)}
            </span>
            {entry.location ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {entry.location}
              </span>
            ) : null}
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={() => onDelete(entry.id)}
          isLoading={isDeleting}
          className="rounded-md px-2.5 py-1.5 text-xs"
          aria-label="Delete entry"
        >
          Delete
        </Button>
      </div>

      {entry.imageUrl ? (
        <div className="mt-3 overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-2)]">
          <img
            src={entry.imageUrl}
            alt="Journal context"
            className="h-32 w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      {note ? (
        <div className="mt-3 rounded-md border border-[var(--border-soft)] bg-[var(--surface-2)] p-3">
          <p className="text-sm leading-relaxed text-[var(--foreground)] whitespace-pre-wrap">{noteToShow}</p>
          {isLongNote ? (
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="mt-2 text-xs font-medium text-[var(--muted-text)] transition-colors hover:text-[var(--foreground)]"
            >
              {isExpanded ? "Collapse" : "Show more"}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
