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
  img_icon_url?: string;
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
  const url = `${API_BASE}/IPlayerService/GetRecentlyPlayedGames/v1/?key=${getKey()}&steamid=${steamId}&count=20`;
  const data = await fetchJson<{ response: { games?: RawGame[] } }>(url);
  return normalizeGames(data.response?.games ?? []);
}

export async function getTopAllTime(steamId: string, count = 10): Promise<SteamGame[]> {
  const url =
    `${API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${getKey()}` +
    `&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`;
  const data = await fetchJson<{ response: { games?: RawGame[] } }>(url);
  const games = normalizeGames(data.response?.games ?? []).filter(
    (g) => g.playtime_forever > 0
  );
  games.sort((a, b) => b.playtime_forever - a.playtime_forever);
  return games.slice(0, count);
}

function normalizeGames(games: RawGame[]): SteamGame[] {
  return games
    .filter((g): g is RawGame & { appid: number } => typeof g.appid === "number")
    .map((g) => ({
      appid: g.appid,
      name: g.name ?? `App ${g.appid}`,
      playtime_forever: g.playtime_forever ?? 0,
      playtime_2weeks: g.playtime_2weeks,
      img_icon_url: g.img_icon_url,
    }));
}

/** Steam CDN image helpers -- no auth required. */
export const steamImg = {
  /** 460x215 store capsule */
  capsule: (appid: number) =>
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
  /** 1920x620 library hero */
  libraryHero: (appid: number) =>
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_hero.jpg`,
  /** transparent logo, good for overlays */
  libraryLogo: (appid: number) =>
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/logo.png`,
  /** small 184x69 capsule */
  capsuleSmall: (appid: number) =>
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_184x69.jpg`,
};

export function minutesToHours(min: number): number {
  return Math.round((min / 60) * 10) / 10;
}
