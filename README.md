# STEAM://REPLAY

A retro-terminal style "gaming receipt" for your Steam account — think
[receiptify](https://receiptify.herokuapp.com/) crossed with Steam Replay,
rendered on a phosphor CRT.

Sign in through Steam, pick a time range (last 2 weeks or all-time top 10),
and download a shareable PNG of your recently played games.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for styling (custom phosphor palette, CRT effects)
- **Steam OpenID 2.0** for sign-in (no password handled)
- **Steam Web API** for player summary + recent/owned games
- **html-to-image** for client-side PNG export

## Setup

1. **Get a Steam Web API key** at <https://steamcommunity.com/dev/apikey>.
2. Copy the env file and fill it in:
   ```bash
   cp .env.example .env.local
   ```
   - `STEAM_API_KEY` — your key from step 1
   - `SESSION_SECRET` — any long random string (used to sign cookies)
   - `NEXT_PUBLIC_BASE_URL` — e.g. `http://localhost:3000`
3. Install deps:
   ```bash
   npm install
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

Open <http://localhost:3000> and click **[ SIGN IN THROUGH STEAM ]**.

## How auth works

Steam does not use OAuth. It uses **OpenID 2.0**:

1. `/api/auth/steam` redirects the browser to Steam with OpenID params.
2. Steam sends the user back to `/api/auth/steam/callback?openid.*=...`.
3. The callback POSTs those params back to Steam with
   `openid.mode=check_authentication` — if Steam replies `is_valid:true`,
   we trust the `claimed_id`, extract the SteamID64, and set an
   HMAC-signed session cookie.

Your SteamID64 is all we ever store, and only in the cookie itself.

## Data sources

- `ISteamUser/GetPlayerSummaries/v2` — username + avatar
- `IPlayerService/GetRecentlyPlayedGames/v1` — last 2 weeks
- `IPlayerService/GetOwnedGames/v1` — filtered & sorted for all-time top 10
- Game artwork from `cdn.cloudflare.steamstatic.com/steam/apps/<appid>/...`
  (no API key needed)

If someone's game details are set to private, the API returns no games
and the page shows a friendly empty state.

## Project layout

```
app/
  page.tsx                           landing page
  u/[steamid]/page.tsx               receipt page
  api/auth/steam/route.ts            OpenID start
  api/auth/steam/callback/route.ts   OpenID verify + set cookie
  api/auth/logout/route.ts           clear cookie
  layout.tsx                         fonts + root shell
  globals.css                        CRT effects
components/
  TerminalCard.tsx                   the receipt itself (id=receipt-card)
  DownloadButton.tsx                 html-to-image PNG export
  RangeToggle.tsx                    last 2 weeks / all-time
lib/
  openid.ts                          Steam OpenID 2.0 helper
  session.ts                         HMAC-signed session cookie
  steam.ts                           Steam Web API wrappers
```

## Deploying

Works out of the box on Vercel. Set the three env vars and set
`NEXT_PUBLIC_BASE_URL` to your deployed URL so Steam redirects land back
on the right host.

## Notes / gotchas

- Steam is picky about `openid.return_to` matching `openid.realm`. Both
  are derived from `NEXT_PUBLIC_BASE_URL`; keep it in sync with the
  actual host.
- `html-to-image` needs images to be CORS-enabled. Steam CDN images
  serve with permissive CORS, so this mostly just works, but if a PNG
  render comes out with a missing capsule, that's where to look.
- Not affiliated with Valve or Steam.
