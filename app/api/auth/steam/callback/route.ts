import { NextResponse } from "next/server";
import { verifyCallback } from "@/lib/openid";
import { setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const steamId = await verifyCallback(url.searchParams);

  if (!steamId) {
    return NextResponse.redirect(new URL("/?auth=failed", url.origin));
  }

  await setSessionCookie(steamId);
  return NextResponse.redirect(new URL(`/u/${steamId}`, url.origin));
}
