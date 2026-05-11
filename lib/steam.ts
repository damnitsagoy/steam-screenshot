/**
 * Thin wrappers around the Steam Web API.
 * Docs: https://steamcommunity.com/dev
 *       https://partner.steamgames.com/doc/webapi
 *
 * All calls run server-side so STEAM_API_KEY never leaves the server.
 */

const API_BASE = "https://api.steampowered.com";

function getKey(): string {
  const k = process.env.STEAM_API_KEY;
  if (!k) throw new Error("STEAM_API_KEY is not set");
  return k;
}

export type Range = "7d" | "2w" | "1m" | "all";

export type PlayerSummary = {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatarfull: string;
};

export type SteamGame = {
  appid: number;
  name: string;
  /** minutes */
  playtime_forever: number;
  /** minutes */
  playtime_2weeks?: number;
  /** unix seconds */
  rtime_last_played?: number;
  img_icon_url?: string;
};

export type RangeStats = {
  games: SteamGame[];
  totalMinutes: number;
  /** true if the playtime shown is an estimate (derived, not a true range total) */
  approximate: boolean;
  label: string;
};

type RawPlayer = {
  steamid?: string;
  personaname?: string;
  profileurl?: string;
  avatarfull?: string;
};

type RawGame = {
  appid?: number;
  name?: string;
  playtime_forever?: number;
  playtime_2weeks?: number;
  rtime_last_played?: number;
  img_icon_url?: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Steam API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export async function getPlayerSummary(steamId: string): Promise<PlayerSummary | null> {
  const url = `${API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${getKey()}&steamids=${steamId}`;
  const data = await fetchJson<{ response: { players: RawPlayer[] } }>(url);
  const p = data.response?.players?.[0];
  if (!p?.steamid) return null;
  return {
    steamid: p.steamid,
    personaname: p.personaname ?? "Unknown",
    profileurl: p.profileurl ?? "",
    avatarfull: p.avatarfull ?? "",
  };
}

export async function getRecentlyPlayed(steamId: string): Promise<SteamGame[]> {
  const url = `${API_BASE}/IPlayerService/GetRecentlyPlayedGames/v1/?key=${getKey()}&steamid=${steamId}&count=50`;
  const data = await fetchJson<{ response: { games?: RawGame[] } }>(url);
  return normalizeGames(data.response?.games ?? []);
}

export async function getOwnedGames(steamId: string): Promise<SteamGame[]> {
  const url =
    `${API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${getKey()}` +
    `&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`;
  const data = await fetchJson<{ response: { games?: RawGame[] } }>(url);
  return normalizeGames(data.response?.games ?? []);
}

function normalizeGames(games: RawGame[]): SteamGame[] {
  return games
    .filter((g): g is RawGame & { appid: number } => typeof g.appid === "number")
    .map((g) => ({
      appid: g.appid,
      name: g.name ?? `App ${g.appid}`,
      playtime_forever: g.playtime_forever ?? 0,
      playtime_2weeks: g.playtime_2weeks,
      rtime_last_played: g.rtime_last_played,
      img_icon_url: g.img_icon_url,
    }));
}

/**
 * Get stats for a given range. Steam only exposes true 2-week and all-time
 * playtime totals. For 7d and 1m we filter games by `rtime_last_played` and
 * proportionally estimate their contribution from playtime_2weeks when
 * available — so those totals are marked `approximate`.
 */
export async function getRangeStats(
  steamId: string,
  range: Range
): Promise<RangeStats> {
  if (range === "2w") {
    const recent = await getRecentlyPlayed(steamId);
    const games = recent
      .slice()
      .sort(
        (a, b) => (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0)
      );
    const total = games.reduce((a, g) => a + (g.playtime_2weeks ?? 0), 0);
    return {
      games,
      totalMinutes: total,
      approximate: false,
      label: "LAST 2 WEEKS",
    };
  }

  if (range === "all") {
    const owned = await getOwnedGames(steamId);
    const games = owned
      .filter((g) => g.playtime_forever > 0)
      .sort((a, b) => b.playtime_forever - a.playtime_forever);
    const total = games.reduce((a, g) => a + g.playtime_forever, 0);
    return {
      games,
      totalMinutes: total,
      approximate: false,
      label: "ALL TIME",
    };
  }

  // 7d and 1m: filter by last-played timestamp, estimate contribution.
  const days = range === "7d" ? 7 : 30;
  const cutoff = Math.floor(Date.now() / 1000) - days * 86_400;

  const owned = await getOwnedGames(steamId);
  const recentIdx = new Map<number, SteamGame>();
  for (const g of await getRecentlyPlayed(steamId)) recentIdx.set(g.appid, g);

  const filtered = owned
    .filter((g) => (g.rtime_last_played ?? 0) >= cutoff && g.playtime_forever > 0)
    .map((g) => {
      // If the game shows up in recent (i.e. played in last 14d), scale its
      // 2-week minutes to the requested window. Otherwise fall back to a
      // conservative fraction of playtime_forever.
      const twoWeekMin = recentIdx.get(g.appid)?.playtime_2weeks;
      let estimate: number;
      if (twoWeekMin !== undefined) {
        estimate =
          range === "7d" ? Math.round(twoWeekMin / 2) : twoWeekMin; // ~ bounded
      } else {
        estimate = Math.min(g.playtime_forever, 120); // unknown, cap at 2h
      }
      return { ...g, _estimate: estimate };
    });

  filtered.sort((a, b) => b._estimate - a._estimate);

  const games: SteamGame[] = filtered.map((g) => ({
    ...g,
    playtime_2weeks: g._estimate, // overload this field for rendering consistency
  }));
  const total = filtered.reduce((a, g) => a + g._estimate, 0);

  return {
    games,
    totalMinutes: total,
    approximate: true,
    label: range === "7d" ? "LAST 7 DAYS" : "LAST MONTH",
  };
}

/**
 * Route every Steam image through our own `/api/img` proxy so the
 * browser treats them as same-origin. This is what makes html-to-image
 * capture reliably on mobile -- cross-origin canvas painting otherwise
 * breaks silently when Steam's CDN drops CORS headers on cached edges.
 */
export function proxied(url: string): string {
  return `/api/img?u=${encodeURIComponent(url)}`;
}

/** Steam CDN image helpers -- all routed through our proxy. */
export const steamImg = {
  /** 460x215 store capsule (landscape) */
  capsule: (appid: number) =>
    proxied(
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`
    ),
  /** 600x900 portrait library capsule (what Steam library shows) */
  libraryCapsule: (appid: number) =>
    proxied(
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`
    ),
  /** 1920x620 library hero */
  libraryHero: (appid: number) =>
    proxied(
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_hero.jpg`
    ),
  /** transparent logo, good for overlays */
  libraryLogo: (appid: number) =>
    proxied(
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/logo.png`
    ),
  /** small 184x69 capsule */
  capsuleSmall: (appid: number) =>
    proxied(
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_184x69.jpg`
    ),
};

export function minutesToHours(min: number): number {
  return Math.round((min / 60) * 10) / 10;
}
