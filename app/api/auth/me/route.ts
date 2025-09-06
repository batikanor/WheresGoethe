import { fetchUser } from "@/lib/neynar";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Middleware adds this header after verifying the JWT
    const fid = req.headers.get("x-user-fid");
    if (!fid) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const user = await fetchUser(fid);
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
