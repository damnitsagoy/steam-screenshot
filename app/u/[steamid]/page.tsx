import { notFound } from "next/navigation";
import Link from "next/link";
import TerminalCard from "@/components/TerminalCard";
import DownloadButton from "@/components/DownloadButton";
import RangeToggle from "@/components/RangeToggle";
import ScaleToFit from "@/components/ScaleToFit";
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
    <main className="relative mx-auto flex w-full max-w-[520px] flex-col items-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-5 flex w-full items-center justify-between text-xs text-white/60">
        <Link href="/" className="hover:text-white">
          ← back
        </Link>
        <a href="/api/auth/logout" className="hover:text-white">
          log out
        </a>
      </div>

      {/* Horizontally scrollable on very narrow phones so 4 pills never wrap. */}
      <div className="w-full overflow-x-auto pb-1">
        <div className="mx-auto flex w-max">
          <RangeToggle current={range} steamid={steamid} />
        </div>
      </div>

      {/* ScaleToFit keeps the card always at 9:16 visually, regardless of
          viewport, while the card itself renders at a fixed 540x960 design
          size so its content never overflows or clips. */}
      <div className="mt-5 w-full">
        <ScaleToFit designWidth={540} designHeight={960} maxWidth={540}>
          <TerminalCard
            player={player}
            games={stats.games}
            range={range}
            rangeLabel={stats.label}
            approximate={stats.approximate}
            totalMinutes={stats.totalMinutes}
          />
        </ScaleToFit>
      </div>

      <div className="mt-5">
        <DownloadButton
          targetId="receipt-card"
          filename={`steam-report-${player.personaname.replace(/\s+/g, "_")}-${range}.png`}
        />
      </div>

      {stats.approximate && stats.games.length > 0 && (
        <p className="mt-4 max-w-sm text-center text-xs text-white/50">
          Steam only exposes 2-week and all-time playtime; 7-day and 1-month
          hours are estimated from last-played timestamps.
        </p>
      )}

      {stats.games.length === 0 && (
        <div className="mt-6 max-w-sm text-center">
          <p className="text-sm text-white/70">
            No games found in this window. Your profile&apos;s game details may
            be private, or you haven&apos;t played anything recently.
          </p>
          <Link
            href="/troubleshoot"
            className="mt-3 inline-block text-xs text-accent-yellow underline underline-offset-2 hover:text-white"
          >
            How to fix this →
          </Link>
        </div>
      )}

      {/* Extra bottom padding so on mobile the download button and caption
          are comfortably scrollable above the bottom browser chrome. */}
      <div aria-hidden className="h-10" />
    </main>
  );
}
