import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "srr_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/** Encode a SteamID64 into a signed cookie string: "<id>.<sig>" */
export function encodeSession(steamId: string): string {
  return `${steamId}.${sign(steamId)}`;
}

export function decodeSession(raw: string | undefined): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!/^\d+$/.test(id)) return null;
  if (!safeEqualHex(sig, sign(id))) return null;
  return id;
}

export async function setSessionCookie(steamId: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, encodeSession(steamId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSessionSteamId(): Promise<string | null> {
  const jar = await cookies();
  return decodeSession(jar.get(COOKIE_NAME)?.value);
}
