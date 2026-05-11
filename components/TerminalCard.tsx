import Image from "next/image";
import {
  minutesToHours,
  steamImg,
  type PlayerSummary,
  type SteamGame,
} from "@/lib/steam";

type Props = {
  player: PlayerSummary;
  games: SteamGame[];
  range: "recent" | "alltime";
};

/**
 * Retro-terminal "Steam Replay" receipt.
 * The root element has id="receipt-card" so html-to-image can target it.
 */
export default function TerminalCard({ player, games, range }: Props) {
  const totalMinutes = games.reduce(
    (acc, g) =>
      acc +
      (range === "recent" ? g.playtime_2weeks ?? 0 : g.playtime_forever),
    0
  );
  const totalHours = minutesToHours(totalMinutes);
  const maxMinutes = Math.max(
    1,
    ...games.map((g) =>
      range === "recent" ? g.playtime_2weeks ?? 0 : g.playtime_forever
    )
  );
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getUTCDate()).padStart(2, "0")}`;

  const heroAppid = games[0]?.appid;

  return (
    <div
      id="receipt-card"
      className="relative overflow-hidden border border-phosphor bg-panel p-6 font-mono text-phosphor shadow-phosphor"
    >
      {/* overlays (stay inside the captured card) */}
      <div className="pointer-events-none absolute inset-0 scanlines" />
      <div className="pointer-events-none absolute inset-0 crt-vignette" />

      {/* Hero artwork background, dimmed */}
      {heroAppid && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 phosphor-tint"
          style={{
            backgroundImage: `url(${steamImg.libraryHero(heroAppid)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "grayscale(0.5) contrast(1.1) saturate(0.85)",
          }}
        />
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-phosphor-dark pb-3">
        <div>
          <div className="crt-text font-terminal text-3xl leading-none">
            STEAM://REPLAY
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-phosphor-dim">
            {range === "recent" ? "// last_14_days" : "// all_time_top_10"}
          </div>
        </div>

        {player.avatarfull && (
          // Using <img> so html-to-image can inline it without next/image quirks.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.avatarfull}
            alt=""
            crossOrigin="anonymous"
            className="h-16 w-16 border border-phosphor-dim phosphor-tint"
          />
        )}
      </div>

      {/* Meta line */}
      <div className="relative z-10 mt-4 grid grid-cols-2 gap-2 text-xs text-phosphor-dim">
        <div>
          <span className="text-phosphor-amber">USER</span>{" "}
          <span className="text-phosphor">{player.personaname}</span>
        </div>
        <div className="text-right">
          <span className="text-phosphor-amber">DATE</span>{" "}
          <span className="text-phosphor">{stamp}</span>
        </div>
        <div>
          <span className="text-phosphor-amber">GAMES</span>{" "}
          <span className="text-phosphor">{games.length}</span>
        </div>
        <div className="text-right">
          <span className="text-phosphor-amber">HOURS</span>{" "}
          <span className="text-phosphor">{totalHours}</span>
        </div>
      </div>

      {/* Game list */}
      <div className="relative z-10 mt-5 space-y-3">
        {games.map((g, i) => {
          const minutes =
            range === "recent" ? g.playtime_2weeks ?? 0 : g.playtime_forever;
          const hours = minutesToHours(minutes);
          const pct = Math.max(6, Math.round((minutes / maxMinutes) * 100));

          return (
            <div
              key={g.appid}
              className="flex items-stretch gap-3 border border-phosphor-dark bg-black/30"
            >
              {/* Capsule artwork */}
              <div className="relative h-[54px] w-[140px] shrink-0 overflow-hidden border-r border-phosphor-dark">
                <Image
                  src={steamImg.capsule(g.appid)}
                  alt={g.name}
                  fill
                  sizes="140px"
                  className="object-cover phosphor-tint"
                  unoptimized
                />
              </div>

              {/* Text + playtime bar */}
              <div className="flex min-w-0 flex-1 flex-col justify-center pr-3 py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="truncate text-sm">
                    <span className="text-phosphor-dim">
                      [{String(i + 1).padStart(2, "0")}]
                    </span>{" "}
                    <span className="crt-text">{g.name.toUpperCase()}</span>
                  </div>
                  <div className="shrink-0 text-xs text-phosphor-amber">
                    {hours}h
                  </div>
                </div>

                <div className="mt-1 h-1.5 w-full bg-phosphor-dark">
                  <div
                    className="h-full bg-phosphor"
                    style={{
                      width: `${pct}%`,
                      boxShadow: "0 0 6px rgba(57,255,20,0.8)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-6 flex items-center justify-between border-t border-phosphor-dark pt-3 text-[10px] uppercase tracking-[0.25em] text-phosphor-dim">
        <span>&gt; end_of_transmission</span>
        <span>steam://replay</span>
      </div>
    </div>
  );
}
