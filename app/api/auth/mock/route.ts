import { env } from "@/lib/env";
import { NeynarUser } from "@/lib/neynar";
import * as jose from "jose";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (_req: NextRequest) => {
  // Restrict to local development usage for safety
  if (env.IS_LOCAL_DEVELOPMENT !== "true") {
    return NextResponse.json({ error: "Mock auth disabled" }, { status: 403 });
  }

  const user: NeynarUser = {
    fid: "999999",
    username: "mockuser",
    display_name: "Mock User",
    pfp_url: "/images/icon.png",
    custody_address: "0x0000000000000000000000000000000000000000",
    verifications: [],
  };

  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new jose.SignJWT({
    fid: user.fid,
    walletAddress: user.custody_address,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const response = NextResponse.json({ success: true, user });
  response.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    // In local dev we often run over http; secure cookies would be dropped.
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
};
