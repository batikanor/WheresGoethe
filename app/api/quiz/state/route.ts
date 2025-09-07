import { env } from "@/lib/env";
import { redis } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

function key(fid: string, version: string) {
  return `quiz:${version}:fid:${fid}`;
}

export async function GET(req: NextRequest) {
  const fid = req.headers.get("x-user-fid");
  if (!fid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!redis) return NextResponse.json({ results: null });
  const version = env.QUIZ_VERSION;
  const data = await redis.get(key(fid, version));
  return NextResponse.json({ results: data ?? null, version });
}

export async function POST(req: NextRequest) {
  const fid = req.headers.get("x-user-fid");
  if (!fid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!redis) return NextResponse.json({ error: "no redis" }, { status: 500 });
  const version = env.QUIZ_VERSION;
  const body = await req.json();
  // Save only if not already present (prevent replays on same version)
  const k = key(fid, version);
  const existing = await redis.get(k);
  if (existing) {
    return NextResponse.json({ ok: true, results: existing, version });
  }
  await redis.set(k, body);
  return NextResponse.json({ ok: true, results: body, version });
}
