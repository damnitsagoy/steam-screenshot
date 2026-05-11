import Link from "next/link";
import { getSessionSteamId } from "@/lib/session";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const sp = await searchParams;
  const existing = await getSessionSteamId();
  const authFailed = sp?.auth === "failed";

  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="replay-strip mb-10 h-1.5 w-40 rounded-full" />

      <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
        Your Steam Replay.
      </h1>
      <p className="mt-4 max-w-md text-white/70">
        A shareable recap of your recent games — hours, top titles, and a
        downloadable 9:16 card you can post anywhere.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/api/auth/steam"
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-lg transition hover:bg-white/90"
        >
          Sign in through Steam
        </a>
        {existing && (
          <Link
            href={`/u/${existing}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 hover:text-white"
          >
            View my replay
          </Link>
        )}
      </div>

      {authFailed && (
        <p className="mt-6 text-sm text-red-300">
          Steam OpenID verification failed. Please try again.
        </p>
      )}

      <p className="mt-16 text-xs text-white/40">
        Not affiliated with Valve or Steam. We only read your public profile
        and recent games — no password is ever requested.
      </p>
    </main>
  );
}
