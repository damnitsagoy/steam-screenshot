import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await clearSessionCookie();
  const url = new URL(req.url);
  return NextResponse.redirect(new URL("/", url.origin));
}
