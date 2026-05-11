import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // fast + cheap; just proxies bytes

/**
 * Image proxy for Steam CDN assets.
 *
 * Why this exists: html-to-image draws images onto a canvas to serialize
 * the PNG. If those images came from a different origin and the browser
 * couldn't verify CORS headers, the canvas gets "tainted" and the image
 * is silently dropped (or painted as a broken placeholder).
 *
 * Steam's CDNs usually do send permissive CORS, but Cloudflare edge
 * responses have been observed (especially on mobile) to drop the
 * Access-Control-Allow-Origin header, which corrupts exports.
 *
 * By serving every image through /api/img on our own origin, CORS is
 * never an issue -- the browser always has untainted bytes to paint.
 */

// Only allow known Steam image hosts so we don't become an open proxy.
const ALLOWED_HOSTS = new Set([
  "cdn.cloudflare.steamstatic.com",
  "shared.cloudflare.steamstatic.com",
  "avatars.steamstatic.com",
  "avatars.cloudflare.steamstatic.com",
  "steamcdn-a.akamaihd.net",
  "community.cloudflare.steamstatic.com",
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("u");

  if (!target) {
    return new NextResponse("missing ?u", { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return new NextResponse("invalid url", { status: 400 });
  }

  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    return new NextResponse("forbidden host", { status: 403 });
  }

  const upstream = await fetch(url.toString(), {
    headers: {
      // Some Steam endpoints 403 without a browser-ish UA.
      "User-Agent":
        "Mozilla/5.0 (SteamReport-Proxy) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
    // Vercel caches based on the response Cache-Control headers below.
    cache: "force-cache",
  }).catch(() => null);

  if (!upstream || !upstream.ok) {
    return new NextResponse("upstream error", {
      status: upstream?.status ?? 502,
    });
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      // Explicit CORS in case the page ever requests from another origin
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}
