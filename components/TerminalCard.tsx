import {
  minutesToHours,
  proxied,
  steamImg,
  type PlayerSummary,
  type SteamGame,
  type Range,
} from "@/lib/steam";
import Barcode from "@/components/Barcode";

type Props = {
  player: PlayerSummary;
  games: SteamGame[];
  range: Range;
  rangeLabel: string;
  approximate: boolean;
  totalMinutes: number;
};

/**
 * "Steam Report" share card at a fixed design size of 540 x 960 (9:16).
 */
export default function TerminalCard({
  player,
  games,
  range,
  rangeLabel,
  approximate,
  totalMinutes,
}: Props) {
  const top = games.slice(0, 5);

  // For all-time, always use playtime_forever. For other ranges, use
  // playtime_2weeks (which holds the estimated/actual window playtime).
  const getMinutes = (g: SteamGame) =>
    range === "all" ? g.playtime_forever : (g.playtime_2weeks ?? g.playtime_forever);

  const maxMinutes = Math.max(1, ...top.map(getMinutes));
  const totalHours = minutesToHours(totalMinutes);
  const gamesPlayedCount = games.length;
  const uniqueCount = games.length;
  const heroAppid = top[0]?.appid;

  const year = new Date().getFullYear();
  const dateRange = computeDateRange(range);

  return (
    <div
      id="receipt-card"
      className="receipt-card relative overflow-hidden rounded-3xl replay-bg text-white shadow-2xl"
      style={{
        width: 540,
        height: 960,
      }}
    >
      {/* Gradient top strip */}
      <div className="replay-strip absolute inset-x-0 top-0 h-8 z-30 flex items-center px-5">
        <span className="font-display text-[13px] font-semibold tracking-tight text-black/80">
          Steam Report {year}
        </span>
      </div>

      {/* Hero artwork */}
      {heroAppid && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src={steamImg.libraryHero(heroAppid)}
            crossOrigin="anonymous"
            alt=""
            className="pointer-events-none absolute inset-x-0 top-0 z-0 w-full object-cover"
            style={{
              height: "60%",
              filter: "saturate(0.7) brightness(0.55) blur(1px)",
              opacity: 0.55,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-[1]"
            style={{
              height: "60%",
              background:
                "linear-gradient(to bottom," +
                " rgba(20,8,18,0) 0%," +
                " rgba(20,8,18,0.15) 40%," +
                " rgba(20,8,18,0.7) 80%," +
                " rgba(20,8,18,1) 100%)",
            }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-20 flex h-full flex-col px-7 pt-14 pb-7">
        {/* User row */}
        <div className="flex items-center gap-3">
          {player.avatarfull && (
            <div
              className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10"
              style={{
                boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proxied(player.avatarfull)}
                alt=""
                crossOrigin="anonymous"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {player.personaname}
            </div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">
              {rangeLabel}
            </div>
            {/* Date range under the label */}
            <div className="text-[10px] text-white/40">
              {dateRange}
            </div>
          </div>
        </div>

        {/* Hero stat */}
        <div className="mt-7">
          <div className="font-display text-[88px] leading-[0.9] font-bold tracking-tight">
            {gamesPlayedCount}
          </div>
          <div className="mt-1 text-base font-medium text-white/80">
            {gamesPlayedCount === 1 ? "Game Played" : "Games Played"}
          </div>
        </div>

        {/* Secondary stat row */}
        <div className="mt-6 grid grid-cols-2 gap-5">
          <Stat
            value={`${approximate ? "~" : ""}${totalHours}`}
            label="Hours Played"
            color="text-accent-yellow"
          />
          <Stat
            value={uniqueCount.toString()}
            label="Unique Titles"
            color="text-accent-green"
          />
        </div>

        {/* Top games - vertical stack */}
        <div className="mt-7 flex-1">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold">Top Games</h2>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              by playtime
            </span>
          </div>

          {top.length === 0 ? (
            <p className="text-sm text-white/60">
              No games played in this window.
            </p>
          ) : (
            <ol className="space-y-2">
              {top.map((g, i) => {
                const minutes = getMinutes(g);
                const hours = minutesToHours(minutes);
                const barPct = Math.max(
                  6,
                  Math.round((minutes / maxMinutes) * 100)
                );
                return (
                  <li
                    key={g.appid}
                    className="flex items-center gap-3 rounded-lg bg-white/[0.04] p-2 ring-1 ring-white/5"
                  >
                    {/* Landscape capsule thumbnail */}
                    <div className="relative h-[42px] w-[90px] shrink-0 overflow-hidden rounded-md ring-1 ring-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={steamImg.capsule(g.appid)}
                        alt={g.name}
                        crossOrigin="anonymous"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Rank + name + bar */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="min-w-0 truncate text-sm font-semibold">
                          <span className="mr-2 text-white/40 tabular-nums">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {g.name}
                        </div>
                        <div className="shrink-0 text-sm font-semibold tabular-nums text-white/90">
                          {approximate && range !== "all" ? "~" : ""}
                          {hours}h
                        </div>
                      </div>
                      <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${barPct}%`,
                            background: barColor(i),
                          }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Footer with barcode + branding */}
        <div className="mt-auto pt-5 flex flex-col items-center gap-2">
          <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.22em] text-white/40">
            <span>steam-report</span>
            <span>
              {approximate ? "estimated · " : ""}
              generated {formatDate()}
            </span>
          </div>

          {/* Barcode + URL + Steam logo row */}
          <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-white/5 w-full">
            <Barcode
              url="https://steam-screenshot-topaz.vercel.app/"
              width={220}
              height={32}
              className="text-white/50"
            />
            <div className="flex items-center gap-2">
              {/* Steam logo (inline SVG) */}
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5 text-white/40"
                aria-hidden
              >
                <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.387 3.387 0 0 1 1.912-.59c.064 0 .127.003.19.006l2.861-4.142v-.058a4.527 4.527 0 0 1 4.524-4.524 4.527 4.527 0 0 1 4.524 4.524 4.527 4.527 0 0 1-4.524 4.524h-.105l-4.076 2.911c0 .052.004.105.004.158a3.39 3.39 0 0 1-3.39 3.393 3.406 3.406 0 0 1-3.345-2.82L.453 15.306A11.986 11.986 0 0 0 11.979 24c6.627 0 12-5.373 12-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61a2.542 2.542 0 0 0 4.645-.903 2.543 2.543 0 0 0-2.541-2.545c-.164 0-.325.016-.483.047l1.523.63a1.868 1.868 0 0 1-1.423 3.453l-.248-.072zm8.4-8.794a3.016 3.016 0 0 0-3.012-3.012 3.016 3.016 0 0 0-3.012 3.012 3.016 3.016 0 0 0 3.012 3.012 3.016 3.016 0 0 0 3.012-3.012zm-5.27-.005a2.26 2.26 0 0 1 2.258-2.258 2.26 2.26 0 0 1 2.258 2.258 2.26 2.26 0 0 1-2.258 2.258 2.26 2.26 0 0 1-2.258-2.258z" />
              </svg>
              <span className="text-[10px] text-white/40 tracking-wide">
                steam-screenshot-topaz.vercel.app
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div>
      <div className={`font-display text-4xl font-bold leading-none ${color}`}>
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-white/70">{label}</div>
    </div>
  );
}

const barPalette = [
  "linear-gradient(90deg,#f4c93c,#f0a742)",
  "linear-gradient(90deg,#7fd16a,#4fbf9c)",
  "linear-gradient(90deg,#4fbf9c,#3a9ac0)",
  "linear-gradient(90deg,#3a9ac0,#4c7fd8)",
  "linear-gradient(90deg,#e36aa8,#c93fa0)",
];
function barColor(i: number) {
  return barPalette[i % barPalette.length];
}

function formatDate() {
  const d = new Date();
  return fmtShort(d);
}

/**
 * Compute a human-readable date range string for the given range type.
 * e.g. "May 5 – May 12, 2026" or "All time" for the all range.
 */
function computeDateRange(range: Range): string {
  const now = new Date();
  const end = fmtShort(now);

  if (range === "all") {
    return "All time";
  }

  const daysBack = range === "7d" ? 7 : range === "2w" ? 14 : 30;
  const start = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  // If same month, collapse: "May 5 – 12, 2026"
  if (
    start.getMonth() === now.getMonth() &&
    start.getFullYear() === now.getFullYear()
  ) {
    const mon = now.toLocaleString("en-US", { month: "short" });
    return `${mon} ${start.getDate()} – ${now.getDate()}, ${now.getFullYear()}`;
  }

  return `${fmtShort(start)} – ${end}`;
}

function fmtShort(d: Date): string {
  const mon = d.toLocaleString("en-US", { month: "short" });
  return `${mon} ${d.getDate()}, ${d.getFullYear()}`;
}
