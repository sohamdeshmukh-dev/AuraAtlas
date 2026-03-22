"use client";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  accentClassName?: string;
  helperText?: string;
}

export default function StatsCard({
  label,
  value,
  icon,
  accentClassName = "text-teal-500",
  helperText,
}: StatsCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-text)]">{label}</p>
        <span className="text-base" aria-hidden>
          {icon}
        </span>
      </div>
      <p className={`text-2xl font-semibold tracking-tight ${accentClassName}`}>{value}</p>
      {helperText ? <p className="mt-1 text-xs text-[var(--subtle-text)]">{helperText}</p> : null}
    </div>
  );
}
