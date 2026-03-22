"use client";

import { ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  helperText?: string;
}

export default function StatsCard({
  label,
  value,
  icon,
  helperText,
}: StatsCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-[var(--muted-text)] font-medium">{label}</p>
        <span className="text-[var(--muted-text)]" aria-hidden>
          {icon}
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">{value}</p>
      {helperText ? <p className="mt-1 text-[11px] text-[var(--subtle-text)]">{helperText}</p> : null}
    </div>
  );
}
