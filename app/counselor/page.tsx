"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw, Users, Activity } from "lucide-react";
import type { CollegeMoodSummary } from "@/app/api/counselor/route";

const MOOD_COLORS: Record<string, string> = {
  Happy: "#34d399",
  Calm: "#60a5fa",
  Neutral: "#a78bfa",
  Sad: "#fbbf24",
  Overwhelmed: "#fb923c",
  Stressed: "#ef4444",
};

const MOOD_ICONS: Record<string, string> = {
  Happy: "😊",
  Calm: "😌",
  Neutral: "😐",
  Sad: "😢",
  Overwhelmed: "😵",
  Stressed: "😰",
};

function MoodBar({ distribution, total }: { distribution: Record<string, number>; total: number }) {
  if (total === 0) return <div className="h-2 rounded-full bg-white/5 w-full" />;
  const moods = ["Happy", "Calm", "Neutral", "Sad", "Overwhelmed", "Stressed"];
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full gap-px">
      {moods.map((mood) => {
        const count = distribution[mood] ?? 0;
        if (count === 0) return null;
        const pct = (count / total) * 100;
        return (
          <div
            key={mood}
            style={{ width: `${pct}%`, backgroundColor: MOOD_COLORS[mood] }}
            title={`${mood}: ${count} (${pct.toFixed(0)}%)`}
          />
        );
      })}
    </div>
  );
}

function CrisisScore({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.6 ? "#ef4444" : score >= 0.4 ? "#fb923c" : score >= 0.2 ? "#fbbf24" : "#34d399";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0">
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="24" cy="24" r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 20}`}
          strokeDashoffset={`${2 * Math.PI * 20 * (1 - score)}`}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
          {pct}%
        </text>
      </svg>
      <span className="text-[9px] text-white/30 uppercase tracking-widest">distress</span>
    </div>
  );
}

function TrendIcon({ direction }: { direction: "up" | "down" | "stable" }) {
  if (direction === "up") return <TrendingUp className="h-3.5 w-3.5 text-rose-400" />;
  if (direction === "down") return <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />;
  return <Minus className="h-3.5 w-3.5 text-white/30" />;
}

export default function CounselorPage() {
  const [campuses, setCampuses] = useState<CollegeMoodSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/counselor");
      if (!res.ok) throw new Error("Failed to load campus data");
      const json = await res.json();
      setCampuses(json.campuses ?? []);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30_000);
    return () => clearInterval(interval);
  }, []);

  const crisisCampuses = campuses.filter((c) => c.is_crisis);
  const totalCheckins24h = campuses.reduce((s, c) => s + c.checkin_count_24h, 0);

  return (
    <div className="min-h-screen bg-[#050913] text-slate-200">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Campus Mental Health Dashboard</h1>
              <p className="text-[11px] text-white/30 font-mono">
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Loading…"}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/10 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-indigo-400" />
              <span className="text-[11px] text-white/40 uppercase tracking-widest font-medium">Campuses Monitored</span>
            </div>
            <p className="text-3xl font-black text-white">{campuses.length}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="text-[11px] text-white/40 uppercase tracking-widest font-medium">Check-ins (24h)</span>
            </div>
            <p className="text-3xl font-black text-white">{totalCheckins24h.toLocaleString()}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${
            crisisCampuses.length > 0
              ? "border-rose-500/40 bg-rose-500/10"
              : "border-white/5 bg-white/[0.03]"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`h-4 w-4 ${crisisCampuses.length > 0 ? "text-rose-400" : "text-white/30"}`} />
              <span className="text-[11px] text-white/40 uppercase tracking-widest font-medium">Crisis Alerts</span>
            </div>
            <p className={`text-3xl font-black ${crisisCampuses.length > 0 ? "text-rose-400" : "text-white"}`}>
              {crisisCampuses.length}
            </p>
          </div>
        </div>

        {/* Crisis banner */}
        {crisisCampuses.length > 0 && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-300">
                  {crisisCampuses.length} campus{crisisCampuses.length > 1 ? "es" : ""} in distress
                </p>
                <p className="text-xs text-rose-400/70 mt-0.5">
                  {crisisCampuses.map((c) => c.name).join(", ")} —{" "}
                  over 60% of recent check-ins indicate Stressed, Sad, or Overwhelmed moods
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading / error states */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-white/30 text-sm">
            Loading campus data…
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {/* Campus grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {campuses.map((campus) => {
              const total24 = campus.checkin_count_24h;
              const distPct = Math.round(campus.crisis_score * 100);
              return (
                <div
                  key={campus.id}
                  className={`relative rounded-2xl border p-5 transition-all ${
                    campus.is_crisis
                      ? "border-rose-500/40 bg-rose-500/5 shadow-[0_0_30px_rgba(239,68,68,0.08)]"
                      : "border-white/5 bg-white/[0.025] hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Crisis badge */}
                  {campus.is_crisis && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5">
                      <AlertTriangle className="h-3 w-3 text-rose-400" />
                      <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Alert</span>
                    </div>
                  )}

                  {/* Top row */}
                  <div className="flex items-start gap-3 mb-4 pr-14">
                    <CrisisScore score={campus.crisis_score} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white leading-tight truncate">{campus.name}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">{campus.city}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-lg">{MOOD_ICONS[campus.dominant_mood] ?? "😐"}</span>
                        <span className="text-xs text-white/50">{campus.dominant_mood}</span>
                        <TrendIcon direction={campus.trend_direction} />
                      </div>
                    </div>
                  </div>

                  {/* Mood bar */}
                  <div className="mb-3">
                    <MoodBar distribution={campus.mood_distribution} total={total24} />
                  </div>

                  {/* Mood legend (top 3) */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4">
                    {Object.entries(campus.mood_distribution)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([mood, count]) => (
                        <div key={mood} className="flex items-center gap-1">
                          <div
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: MOOD_COLORS[mood] ?? "#888" }}
                          />
                          <span className="text-[10px] text-white/40">
                            {mood} {total24 > 0 ? `${Math.round((count / total24) * 100)}%` : "—"}
                          </span>
                        </div>
                      ))}
                    {total24 === 0 && (
                      <span className="text-[10px] text-white/20">No check-ins yet</span>
                    )}
                  </div>

                  {/* Stats footer */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="text-center">
                      <p className="text-base font-black text-white">{total24}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest">24h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-black text-white">{campus.checkin_count_7d}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest">7d</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-base font-black ${distPct >= 60 ? "text-rose-400" : distPct >= 40 ? "text-orange-400" : "text-emerald-400"}`}>
                        {distPct}%
                      </p>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest">distress</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {campuses.length === 0 && !loading && (
              <div className="col-span-full text-center py-16 text-white/20 text-sm">
                No campus data found. Seed demo data from the dashboard first.
              </div>
            )}
          </div>
        )}

        {/* Mood legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
          {Object.entries(MOOD_COLORS).map(([mood, color]) => (
            <div key={mood} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-white/30">{MOOD_ICONS[mood]} {mood}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
