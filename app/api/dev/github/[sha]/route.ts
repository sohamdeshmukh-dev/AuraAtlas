import { NextRequest, NextResponse } from "next/server";

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sha: string }> }
) {
  const { sha } = await params;

  if (!OWNER || !REPO) {
    return NextResponse.json({ files: [] });
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/commits/${sha}`,
      { headers, next: { revalidate: 3600 } }
    );

    if (!res.ok) return NextResponse.json({ files: [] });

    const data = await res.json();
    const files = (data.files ?? []).map((f: any) => ({
      filename: f.filename,
      additions: f.additions,
      deletions: f.deletions,
      status: f.status,
    }));

    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
