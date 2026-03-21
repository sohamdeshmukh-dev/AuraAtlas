"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface CommitFile {
  filename: string;
  additions: number;
  deletions: number;
  status: string;
}

interface GitState {
  commits: Commit[];
  repoConfigured: boolean;
  repoUrl?: string;
  repoName?: string;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 86400 * 7) return `${Math.floor(secs / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

const AVATAR_COLORS = [
  "bg-violet-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-pink-600",
  "bg-indigo-600",
];

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(/[\s_@.-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const dim = size === "md" ? "w-8 h-8 text-sm" : "w-7 h-7 text-xs";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white flex-shrink-0 ${dim} ${color}`}
    >
      {initials || "?"}
    </span>
  );
}

function FileStatusDot({ status }: { status: string }) {
  const color =
    status === "added"
      ? "bg-emerald-400"
      : status === "removed"
      ? "bg-red-400"
      : "bg-amber-400";
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color}`} />;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DevDashboard() {
  const [git, setGit] = useState<GitState>({ commits: [], repoConfigured: false });
  const [gitLoading, setGitLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [expandedSha, setExpandedSha] = useState<string | null>(null);
  const [commitFiles, setCommitFiles] = useState<
    Record<string, CommitFile[] | "loading">
  >({});

  // ── Fetch commits ──────────────────────────────────────────────────────────
  const fetchGit = useCallback(async () => {
    try {
      const res = await fetch("/api/dev/github");
      const data: GitState = await res.json();
      setGit(data);
    } catch {
      setGit({ commits: [], repoConfigured: false, error: "Network error" });
    }
    setGitLoading(false);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    fetchGit();
    const interval = setInterval(fetchGit, 30_000);
    return () => clearInterval(interval);
  }, [fetchGit]);

  // ── Expand commit → lazy load files ───────────────────────────────────────
  const toggleCommit = async (sha: string) => {
    if (expandedSha === sha) {
      setExpandedSha(null);
      return;
    }
    setExpandedSha(sha);
    if (commitFiles[sha]) return;
    setCommitFiles((p) => ({ ...p, [sha]: "loading" }));
    try {
      const res = await fetch(`/api/dev/github/${sha}`);
      const { files } = await res.json();
      setCommitFiles((p) => ({ ...p, [sha]: files ?? [] }));
    } catch {
      setCommitFiles((p) => ({ ...p, [sha]: [] }));
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const contributors = [
    ...new Map(git.commits.map((c) => [c.author, c])).values(),
  ];

  const latestCommit = git.commits[0];

  // Group commits by day
  const grouped: { label: string; commits: Commit[] }[] = [];
  for (const commit of git.commits) {
    const label = dayLabel(commit.date);
    const existing = grouped.find((g) => g.label === label);
    if (existing) {
      existing.commits.push(commit);
    } else {
      grouped.push({ label, commits: [commit] });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-10">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Dev Dashboard
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {git.repoName
                ? `${git.repoName} · `
                : ""}
              Git activity ·{" "}
              <span className="text-zinc-600">
                updated {timeAgo(lastUpdated.toISOString())}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {git.repoUrl && (
              <a
                href={git.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                GitHub ↗
              </a>
            )}
            <button
              onClick={fetchGit}
              disabled={gitLoading}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {gitLoading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* ── Not configured ── */}
        {!git.repoConfigured && (
          <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-5 mb-6">
            <p className="font-semibold text-amber-400 mb-2 text-sm">
              🔧 GitHub not configured
            </p>
            <p className="text-zinc-400 text-sm mb-3">
              Add these to your{" "}
              <code className="text-amber-300 bg-zinc-800 px-1 py-0.5 rounded text-xs">
                .env.local
              </code>{" "}
              and restart the dev server:
            </p>
            <pre className="bg-zinc-900 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-300 font-mono leading-relaxed">
              {`GITHUB_OWNER=your-github-username\nGITHUB_REPO=MentalHealth\nGITHUB_TOKEN=ghp_...  # for private repos`}
            </pre>
            <p className="text-zinc-600 text-xs mt-3">
              Token: github.com → Settings → Developer settings → Personal
              access tokens → repo scope
            </p>
          </div>
        )}

        {git.error && (
          <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 text-sm text-red-400 mb-6">
            {git.error}
          </div>
        )}

        {/* ── Stats + contributors ── */}
        {git.commits.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">Commits shown</p>
              <p className="text-2xl font-bold tabular-nums text-zinc-100">
                {git.commits.length}
              </p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">Contributors</p>
              <p className="text-2xl font-bold tabular-nums text-zinc-100">
                {contributors.length}
              </p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">Last push</p>
              <p className="text-lg font-bold text-zinc-100 leading-tight mt-0.5">
                {latestCommit ? timeAgo(latestCommit.date) : "—"}
              </p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-2">Team</p>
              <div className="flex items-center -space-x-1.5">
                {contributors.slice(0, 5).map((c) => (
                  <div
                    key={c.author}
                    title={c.author}
                    className="ring-2 ring-zinc-800 rounded-full"
                  >
                    <Avatar name={c.author} />
                  </div>
                ))}
                {contributors.length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-zinc-700 ring-2 ring-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-semibold">
                    +{contributors.length - 5}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Commit feed ── */}
        {gitLoading && git.commits.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-20 bg-zinc-800/40 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : git.commits.length === 0 && git.repoConfigured ? (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">No commits found in this repo.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ label, commits: dayCommits }) => (
              <div key={label}>
                {/* Day divider */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                    {label}
                  </span>
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-xs text-zinc-700">
                    {dayCommits.length} commit{dayCommits.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Commits for this day */}
                <div className="space-y-2">
                  {dayCommits.map((commit) => {
                    const isExpanded = expandedSha === commit.sha;
                    const files = commitFiles[commit.sha];
                    const [headline, ...body] = commit.message.split("\n");

                    return (
                      <div
                        key={commit.sha}
                        className="bg-zinc-800/50 border border-zinc-700/40 hover:border-zinc-600/60 rounded-xl overflow-hidden transition-colors"
                      >
                        {/* Commit row */}
                        <button
                          onClick={() => toggleCommit(commit.sha)}
                          className="w-full text-left p-4 hover:bg-zinc-800/80 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <Avatar name={commit.author} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-snug">
                                  {headline}
                                </p>
                                {body.filter(Boolean).length > 0 && (
                                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                                    {body.filter(Boolean).join(" ")}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className="text-xs text-zinc-400 font-medium">
                                    {commit.author}
                                  </span>
                                  <span className="text-zinc-700">·</span>
                                  <span className="text-xs text-zinc-600">
                                    {timeAgo(commit.date)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                              <code className="text-[11px] text-zinc-600 font-mono bg-zinc-900 px-1.5 py-0.5 rounded">
                                {commit.sha.slice(0, 7)}
                              </code>
                              <span className="text-zinc-600 text-xs w-3">
                                {isExpanded ? "▲" : "▼"}
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* Expanded: file changes */}
                        {isExpanded && (
                          <div className="border-t border-zinc-700/50 bg-zinc-900/40 px-4 py-3">
                            {files === "loading" ? (
                              <div className="flex items-center gap-2 text-xs text-zinc-500 py-1">
                                <span className="animate-spin inline-block">
                                  ⏳
                                </span>
                                Loading changed files…
                              </div>
                            ) : !files || files.length === 0 ? (
                              <p className="text-xs text-zinc-600 py-1">
                                No file data available
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                <p className="text-[11px] text-zinc-600 mb-2 uppercase tracking-wider">
                                  {files.length} file
                                  {files.length !== 1 ? "s" : ""} changed
                                </p>
                                {files.slice(0, 15).map((file) => (
                                  <div
                                    key={file.filename}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    <FileStatusDot status={file.status} />
                                    <span className="text-zinc-300 font-mono truncate flex-1 text-[11px]">
                                      {file.filename}
                                    </span>
                                    <span className="text-emerald-400 tabular-nums text-[11px] flex-shrink-0">
                                      +{file.additions}
                                    </span>
                                    <span className="text-red-400 tabular-nums text-[11px] flex-shrink-0">
                                      -{file.deletions}
                                    </span>
                                  </div>
                                ))}
                                {files.length > 15 && (
                                  <p className="text-[11px] text-zinc-600 pl-3">
                                    +{files.length - 15} more files
                                  </p>
                                )}
                                <a
                                  href={commit.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-block text-[11px] text-zinc-500 hover:text-zinc-300 mt-2 transition-colors"
                                >
                                  View full diff on GitHub ↗
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <p className="text-center text-[11px] text-zinc-700 mt-10">
          Auto-refreshes every 30s · Share this URL with your whole team ·{" "}
          {git.repoUrl && (
            <a
              href={git.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-500 transition-colors"
            >
              {git.repoUrl.replace("https://", "")}
            </a>
          )}
        </p>
      </div>
    </div>
  );
}
