# Steam Replay

A shareable Steam Replay-style recap card for your recently played games,
inspired by Spotify Wrapped. Sign in through Steam, pick a time range, and
download a 9:16 PNG you can post anywhere.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** with a custom warm-burgundy Replay palette
- **Steam OpenID 2.0** for sign-in (no password handled)
- **Steam Web API** for player summary, recent games, owned games
- **html-to-image** for 1080×1920 PNG export

## Setup

1. Get a Steam Web API key at <https://steamcommunity.com/dev/apikey>.
2. Copy the env file:
   ```bash
   cp .env.example .env.local
   ```
   - `STEAM_API_KEY` — your key from step 1
   - `SESSION_SECRET` — any long random string (signs the cookie)
   - `NEXT_PUBLIC_BASE_URL` — e.g. `http://localhost:3000`
3. Install deps:
   ```bash
   npm install
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

Open <http://localhost:3000>.

## Time ranges

Four options, via the pill toggle:

| Range      | Source                                    | Exact? |
|------------|-------------------------------------------|--------|
| 7 days     | owned games filtered by `rtime_last_played` | approximate |
| 2 weeks    | `GetRecentlyPlayedGames` (native)         | yes    |
| 1 month    | owned games filtered by `rtime_last_played` | approximate |
| all time   | `GetOwnedGames` sorted by playtime        | yes    |

Steam's API only exposes true playtime totals for 2-week and all-time
windows. For 7-day and 1-month views, we filter the owned-games list by
`rtime_last_played` and estimate each game's contribution from
`playtime_2weeks` (halved for 7d). Totals in those views are prefixed with
`~` to make the approximation explicit. For exact rolling windows you'd
need a DB snapshot of playtimes over time — a good v2.

## How auth works

Steam uses OpenID 2.0, not OAuth:

1. `/api/auth/steam` redirects to Steam with OpenID params.
2. Steam sends the user back to `/api/auth/steam/callback`.
3. We POST those params back to Steam with `openid.mode=check_authentication`.
   If Steam replies `is_valid:true`, we trust `claimed_id`, extract the
   SteamID64, and set an HMAC-signed session cookie.

Your SteamID64 is all we ever store, and only in the cookie itself.

## Project layout

```
app/
  page.tsx                           landing page
  u/[steamid]/page.tsx               replay card page
  api/auth/steam/route.ts            OpenID start
  api/auth/steam/callback/route.ts   OpenID verify + set cookie
  api/auth/logout/route.ts           clear cookie
  layout.tsx   globals.css           fonts + gradients
components/
  TerminalCard.tsx                   the 9:16 card (id=receipt-card)
  DownloadButton.tsx                 html-to-image PNG export at 1080x1920
  RangeToggle.tsx                    pill toggle for 7d / 2w / 1m / all
lib/
  openid.ts                          Steam OpenID 2.0 helper
  session.ts                         HMAC-signed session cookie
  steam.ts                           Steam Web API wrappers + range logic
```

## Deploying

Works out of the box on Vercel. Set the three env vars and set
`NEXT_PUBLIC_BASE_URL` to your deployed URL so Steam redirects land back
on the right host.

## Notes

- `html-to-image` needs CORS-enabled images. Steam's CDN serves permissive
  CORS, so game art + avatars render fine in the PNG.
- Not affiliated with Valve or Steam.
