import { NextResponse } from "next/server";
import { buildLoginUrl } from "@/lib/openid";

export const dynamic = "force-dynamic";

function getBaseUrl(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(req: Request) {
  const base = getBaseUrl(req);
  const returnTo = `${base}/api/auth/steam/callback`;
  const realm = base;
  return NextResponse.redirect(buildLoginUrl(returnTo, realm));
}
