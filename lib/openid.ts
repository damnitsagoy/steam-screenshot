/**
 * Minimal Steam OpenID 2.0 helper.
 *
 * Flow:
 *  1. Redirect user to buildLoginUrl(returnTo).
 *  2. Steam redirects back with OpenID params.
 *  3. Call verifyCallback(searchParams) -> returns the authenticated SteamID64
 *     (or null if verification failed).
 */

const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";

export function buildLoginUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

/**
 * Verify the OpenID response from Steam.
 * Returns the SteamID64 if valid, otherwise null.
 */
export async function verifyCallback(
  params: URLSearchParams
): Promise<string | null> {
  // Echo all openid.* params back to Steam with mode=check_authentication.
  const body = new URLSearchParams();
  for (const [k, v] of params.entries()) {
    if (k.startsWith("openid.")) body.set(k, v);
  }
  body.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const text = await res.text();
  const isValid = /is_valid\s*:\s*true/i.test(text);
  if (!isValid) return null;

  // claimed_id is of the form https://steamcommunity.com/openid/id/<SteamID64>
  const claimedId = params.get("openid.claimed_id") ?? "";
  const match = claimedId.match(
    /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/
  );
  return match ? match[1] : null;
}
