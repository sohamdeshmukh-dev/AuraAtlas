"use client";

import { useMemo } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  JournalEntry,
  getEmotionalBalanceScore,
} from "@/lib/journal";

interface MoodBalanceGraphProps {
  entries: JournalEntry[];
}

interface BalancePoint {
  id: string;
  pointIndex: number;
  xLabel: string;
  dateLabel: string;
  emotion: JournalEntry["emotion"];
  intensity: number;
  score: number;
  positive: number;
  negative: number;
}

interface TooltipContentProps {
  active?: boolean;
  payload?: Array<{ payload: BalancePoint; dataKey?: string | number }>;
}

function formatXAxisDate(input: string) {
  return new Date(input).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTooltipDate(input: string) {
  return new Date(input).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatScore(score: number) {
  return `${score >= 0 ? "+" : ""}${score.toFixed(2)}`;
}

function BalanceTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const scoreItem = payload.find((item) => item.dataKey === "score");
  const point = scoreItem?.payload ?? payload[0]?.payload;
  if (!point) {
    return null;
  }

  return (
    <div className="rounded-md border border-[var(--border-soft)] bg-[var(--surface-1)] p-2.5 shadow-sm">
      <p className="text-sm font-semibold text-[var(--foreground)]">{point.emotion}</p>
      <p className="mt-1 text-xs text-[var(--muted-text)]">Intensity: {point.intensity}</p>
      <p className="text-xs text-[var(--muted-text)]">Generated Score: {formatScore(point.score)}</p>
      <p className="mt-1 text-[11px] text-[var(--subtle-text)]">{point.dateLabel}</p>
    </div>
  );
}

function yAxisTickFormatter(value: number) {
  if (value === 1) {
    return "+1 uplifted";
  }
  if (value === 0) {
    return "0 balanced";
  }
  if (value === -1) {
    return "-1 overwhelmed";
  }
  return "";
}

export default function MoodBalanceGraph({ entries }: MoodBalanceGraphProps) {
  const points = useMemo<BalancePoint[]>(() => {
    return [...entries]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((entry, index) => {
        const score = getEmotionalBalanceScore(entry.emotion, entry.intensity);
        return {
          id: entry.id,
          pointIndex: index,
          xLabel: formatXAxisDate(entry.createdAt),
          dateLabel: formatTooltipDate(entry.createdAt),
          emotion: entry.emotion,
          intensity: entry.intensity,
          score,
          positive: score > 0 ? score : 0,
          negative: score < 0 ? score : 0,
        };
      });
  }, [entries]);

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 text-center">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Emotional Balance</h3>
        <p className="mt-3 text-sm text-[var(--muted-text)]">No data available.</p>
        <p className="mt-1 text-sm text-[var(--subtle-text)]">
          Begin logging entries to generate balance analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-1)] p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Emotional Balance</h3>
          <p className="mt-0.5 text-[11px] text-[var(--muted-text)]">
            Score distribution over time. Positive values indicate uplifted states.
          </p>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={points}
            margin={{ top: 14, right: 8, left: 8, bottom: 4 }}
          >
            <defs>
              <linearGradient id="balancePositiveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34,197,94,0.48)" />
                <stop offset="100%" stopColor="rgba(34,197,94,0.04)" />
              </linearGradient>
              <linearGradient id="balanceNegativeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(239,68,68,0.04)" />
                <stop offset="100%" stopColor="rgba(239,68,68,0.48)" />
              </linearGradient>
              <linearGradient id="balanceLineStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34,197,94,0.95)" />
                <stop offset="52%" stopColor="rgba(148,163,184,0.9)" />
                <stop offset="100%" stopColor="rgba(239,68,68,0.95)" />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="pointIndex"
              type="number"
              domain={[0, Math.max(points.length - 1, 0)]}
              allowDecimals={false}
              tickFormatter={(value: number) => points[Math.round(value)]?.xLabel ?? ""}
              tickLine={false}
              axisLine={{ stroke: "var(--border-soft)" }}
              tick={{ fill: "var(--muted-text)", fontSize: 11 }}
              minTickGap={24}
            />
            <YAxis
              type="number"
              domain={[-1, 1]}
              ticks={[-1, 0, 1]}
              tickFormatter={yAxisTickFormatter}
              tickLine={false}
              axisLine={false}
              width={120}
              tick={{ fill: "var(--muted-text)", fontSize: 11 }}
              label={{
                value: "Emotional Balance",
                angle: -90,
                position: "insideLeft",
                fill: "var(--muted-text)",
                fontSize: 12,
                dx: -2,
              }}
            />

            <ReferenceLine y={0} stroke="rgba(148,163,184,0.5)" strokeDasharray="3 3" />

            <Area
              type="monotone"
              dataKey="positive"
              stroke="none"
              fill="url(#balancePositiveFill)"
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="negative"
              stroke="none"
              fill="url(#balanceNegativeFill)"
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />

            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#balanceLineStroke)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#cbd5e1", stroke: "#0f172a", strokeWidth: 1 }}
              activeDot={{ r: 4, fill: "#f8fafc", stroke: "#0f172a", strokeWidth: 1.5 }}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            />

            <Tooltip
              cursor={{ stroke: "rgba(148,163,184,0.34)", strokeDasharray: "4 4" }}
              content={<BalanceTooltip />}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
