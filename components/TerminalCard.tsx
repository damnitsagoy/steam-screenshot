import {
  minutesToHours,
  proxied,
  steamImg,
  type PlayerSummary,
  type SteamGame,
} from "@/lib/steam";

type Props = {
  player: PlayerSummary;
  games: SteamGame[];
  rangeLabel: string;
  approximate: boolean;
  totalMinutes: number;
};

/**
 * "Steam Report" share card at a fixed design size of 540 x 960 (9:16).
 *
 * Must always render at that exact size -- the parent <ScaleToFit> handles
 * visual scaling for responsive preview. That way:
 *  - Tailwind's fixed-pixel utilities (px-7, text-[88px], etc.) are always
 *    correct relative to the card
 *  - The downloaded PNG is captured at design size and exported at 2x
 *    for a crisp 1080 x 1920 output
 *
 * Root element has id="receipt-card" so html-to-image can target it.
 *
 * Avoids `mix-blend-mode`, `mask-image`, and `background-image` for remote
 * assets because those don't export reliably across mobile browsers via
 * html-to-image. Uses an actual <img crossOrigin="anonymous"> for the hero
 * art, and a sibling gradient div for the fade.
 */
export default function TerminalCard({
  player,
  games,
  rangeLabel,
  approximate,
  totalMinutes,
}: Props) {
  const top = games.slice(0, 5);
  const maxMinutes = Math.max(
    1,
    ...top.map((g) => g.playtime_2weeks ?? g.playtime_forever)
  );
  const totalHours = minutesToHours(totalMinutes);
  const gamesPlayedCount = games.length;
  const uniqueCount = games.length;
  const heroAppid = top[0]?.appid;

  const year = new Date().getFullYear();

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

      {/* Hero artwork as an <img> -- reliable to capture on mobile Safari
          (unlike background-image URLs). */}
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
          {/* Gradient overlay that fades the art into the background color.
              Using a simple linear-gradient (not mask-image) so it captures
              consistently on mobile. */}
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
                // Inner shadow gives the subtle ring effect without
                // painting a stroke *outside* the <img>, which on mobile
                // Safari sometimes appears as a hollow arc when the
                // image fails to load.
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
                const minutes = g.playtime_2weeks ?? g.playtime_forever;
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
                          {approximate ? "~" : ""}
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

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-white/40">
          <span>steam-report</span>
          <span>
            {approximate ? "estimated · " : ""}
            generated {formatDate()}
          </span>
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
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${month} ${d.getDate()}, ${d.getFullYear()}`;
}
