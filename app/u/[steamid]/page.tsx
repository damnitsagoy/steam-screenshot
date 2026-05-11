import { notFound } from "next/navigation";
import Link from "next/link";
import TerminalCard from "@/components/TerminalCard";
import DownloadButton from "@/components/DownloadButton";
import RangeToggle from "@/components/RangeToggle";
import {
  getPlayerSummary,
  getRecentlyPlayed,
  getTopAllTime,
} from "@/lib/steam";

export const dynamic = "force-dynamic";

type Params = { steamid: string };
type Search = { range?: "recent" | "alltime" };

export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { steamid } = await params;
  const sp = await searchParams;
  const range: "recent" | "alltime" = sp.range === "alltime" ? "alltime" : "recent";

  if (!/^\d{17}$/.test(steamid)) notFound();

  const [player, games] = await Promise.all([
    getPlayerSummary(steamid),
    range === "recent" ? getRecentlyPlayed(steamid) : getTopAllTime(steamid, 10),
  ]);

  if (!player) notFound();

  return (
    <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center px-4 py-10">
      <div className="mb-6 flex w-full items-center justify-between font-mono text-xs text-phosphor-dim">
        <Link href="/" className="hover:text-phosphor">
          &lt; back
        </Link>
        <a href="/api/auth/logout" className="hover:text-phosphor">
          [ logout ]
        </a>
      </div>

      <RangeToggle current={range} steamid={steamid} />

      <div className="mt-6 w-full">
        <TerminalCard player={player} games={games} range={range} />
      </div>

      <div className="mt-6">
        <DownloadButton
          targetId="receipt-card"
          filename={`steam-replay-${player.personaname.replace(/\s+/g, "_")}-${range}.png`}
        />
      </div>

      {games.length === 0 && (
        <p className="mt-6 font-mono text-sm text-phosphor-amber">
          &gt; no {range === "recent" ? "recent" : "all-time"} games found.
          {range === "recent"
            ? " profile may be private, or you haven't played anything in the last 2 weeks."
            : " profile game details may be private."}
        </p>
      )}
    </main>
  );
}
