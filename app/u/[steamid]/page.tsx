import { notFound } from "next/navigation";
import Link from "next/link";
import TerminalCard from "@/components/TerminalCard";
import DownloadButton from "@/components/DownloadButton";
import RangeToggle from "@/components/RangeToggle";
import { getPlayerSummary, getRangeStats, type Range } from "@/lib/steam";

export const dynamic = "force-dynamic";

type Params = { steamid: string };
type Search = { range?: string };

function parseRange(raw: string | undefined): Range {
  if (raw === "7d" || raw === "2w" || raw === "1m" || raw === "all") return raw;
  return "2w";
}

export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { steamid } = await params;
  const sp = await searchParams;
  const range = parseRange(sp.range);

  if (!/^\d{17}$/.test(steamid)) notFound();

  const [player, stats] = await Promise.all([
    getPlayerSummary(steamid),
    getRangeStats(steamid, range),
  ]);

  if (!player) notFound();

  return (
    <main className="relative mx-auto flex min-h-screen max-w-xl flex-col items-center px-5 py-8">
      <div className="mb-6 flex w-full items-center justify-between text-xs text-white/60">
        <Link href="/" className="hover:text-white">
          ← back
        </Link>
        <a href="/api/auth/logout" className="hover:text-white">
          log out
        </a>
      </div>

      <RangeToggle current={range} steamid={steamid} />

      <div className="mt-6 w-full">
        <div className="mx-auto" style={{ maxWidth: 480 }}>
          <TerminalCard
            player={player}
            games={stats.games}
            rangeLabel={stats.label}
            approximate={stats.approximate}
            totalMinutes={stats.totalMinutes}
          />
        </div>
      </div>

      <div className="mt-6">
        <DownloadButton
          targetId="receipt-card"
          filename={`steam-replay-${player.personaname.replace(/\s+/g, "_")}-${range}.png`}
        />
      </div>

      {stats.approximate && stats.games.length > 0 && (
        <p className="mt-4 max-w-sm text-center text-xs text-white/50">
          Steam only exposes 2-week and all-time playtime; 7-day and 1-month
          hours are estimated from last-played timestamps.
        </p>
      )}

      {stats.games.length === 0 && (
        <p className="mt-6 max-w-sm text-center text-sm text-white/70">
          No games found in this window. Your profile's game details may be
          private, or you haven't played anything recently.
        </p>
      )}
    </main>
  );
}
