import { NextResponse } from "next/server";

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;

export async function GET() {
  if (!OWNER || !REPO) {
    return NextResponse.json({ commits: [], repoConfigured: false });
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=20`,
      { headers, next: { revalidate: 30 } }
    );

    if (!res.ok) {
      return NextResponse.json({
        commits: [],
        repoConfigured: true,
        error: `GitHub API ${res.status}: ${await res.text()}`,
      });
    }

    const data = await res.json();
    const commits = data.map((c: any) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
    }));

    return NextResponse.json({
      commits,
      repoConfigured: true,
      repoUrl: `https://github.com/${OWNER}/${REPO}`,
      repoName: `${OWNER}/${REPO}`,
    });
  } catch (err: any) {
    return NextResponse.json({
      commits: [],
      repoConfigured: true,
      error: err.message,
    });
  }
}
