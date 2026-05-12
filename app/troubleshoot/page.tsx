import Link from "next/link";

export const metadata = {
  title: "Troubleshoot — Steam Report",
  description:
    "Common fixes when Steam Report doesn't show your games or hours.",
};

export default function TroubleshootPage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-16">
      <Link href="/" className="mb-8 text-xs text-white/60 hover:text-white">
        ← back to home
      </Link>

      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Troubleshooting
      </h1>
      <p className="mt-3 text-sm text-white/60">
        If Steam Report isn&apos;t showing your games or hours, here are the
        most common fixes.
      </p>

      <div className="mt-10 space-y-10">
        {/* Issue 1 */}
        <Section
          number="01"
          title="No games showing up"
          problem="You signed in successfully but the card says 0 games played."
          steps={[
            "Open your Steam client → click your profile name (top right) → Profile → Edit Profile → Privacy Settings.",
            'Set "My profile" to Public.',
            'Set "Game details" to Public. This is the critical one — even if your profile is public, game details can be private separately.',
            "Wait ~5 minutes for Steam's cache to update, then refresh Steam Report.",
          ]}
          note="Steam's API respects these privacy settings strictly. If game details are set to 'Friends Only' or 'Private', the API returns zero games regardless of your profile visibility."
        />

        {/* Issue 2 */}
        <Section
          number="02"
          title="Hours played seem wrong"
          problem="The hours displayed don't match what you see in your Steam library."
          steps={[
            "For 'Last 2 weeks' and 'All time': these use Steam's official playtime numbers and should be accurate.",
            "For '7 days' and '1 month': these are estimates (shown with a ~ prefix). Steam's API only gives exact playtime for 2-week and all-time windows.",
            "If all-time hours look dramatically wrong, try switching to the 'all time' tab — this directly uses Steam's playtime_forever field.",
            "Note: playtime only updates after you close a game. If a game is currently running, its latest session won't show yet.",
          ]}
        />

        {/* Issue 3 */}
        <Section
          number="03"
          title="Sign-in fails or loops"
          problem="Clicking 'Sign in through Steam' brings you back to the homepage with an error."
          steps={[
            "Make sure you're not using a browser extension that blocks redirects or third-party cookies (Steam OpenID requires a redirect chain).",
            "Try a different browser or incognito/private mode.",
            "Clear your cookies for this site and try again.",
            "If you're on a corporate/school network, the Steam OpenID endpoint (steamcommunity.com) might be blocked.",
          ]}
        />

        {/* Issue 4 */}
        <Section
          number="04"
          title="Downloaded PNG is blank or missing images"
          problem="The card looks fine on screen but the downloaded PNG has missing game art or a blank background."
          steps={[
            "Make sure you have a stable internet connection — the download process needs to fetch all game artwork before generating the PNG.",
            "Try waiting a few seconds after the page loads before hitting 'Download PNG' (gives images time to cache).",
            "On iPhone/iOS: if the download doesn't trigger, try using Safari instead of an in-app browser (Instagram, Twitter, etc.).",
            "If images still don't appear, try on a desktop browser — this is the most reliable export environment.",
          ]}
        />

        {/* Issue 5 */}
        <Section
          number="05"
          title="A specific game's artwork is missing"
          problem="Most game thumbnails load fine, but one or two show as blank/broken."
          steps={[
            "Some very new, very old, or delisted games don't have artwork on Steam's CDN.",
            "Free-to-play games that were briefly installed sometimes lack capsule images.",
            "This is a Steam-side issue — there's no fix on our end, but the rest of the card should still render correctly.",
          ]}
        />

        {/* Issue 6 */}
        <Section
          number="06"
          title="Games from 7 days / 1 month aren't showing"
          problem="You played games in the last week but the 7-day or 1-month view is empty."
          steps={[
            "Make sure 'Game details' is set to Public (see fix #01 above).",
            "The 7-day and 1-month views rely on Steam's 'last played' timestamp. If Steam hasn't updated this for your games, they might not appear.",
            "Try the '2 weeks' tab first — this uses a more reliable data source. If games show there but not in 7-day, it's a timestamp lag from Steam.",
            "Wait a few hours and try again — Steam's API caches can take time to propagate.",
          ]}
        />
      </div>

      {/* Still stuck */}
      <div className="mt-16 rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/5">
        <h2 className="font-display text-lg font-semibold">Still stuck?</h2>
        <p className="mt-2 text-sm text-white/60">
          If none of the above helped, the issue is most likely on Steam&apos;s
          side (API lag, privacy cache, or regional outage). Wait 10–15 minutes
          and try again.
        </p>
        <p className="mt-3 text-sm text-white/60">
          You can also open an issue on{" "}
          <a
            href="https://github.com/damnitsagoy/steam-screenshot/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 underline underline-offset-2 hover:text-white"
          >
            GitHub
          </a>{" "}
          and include your Steam profile URL so we can investigate.
        </p>
      </div>

      <p className="mt-10 text-xs text-white/40">
        Not affiliated with Valve or Steam.
      </p>
    </main>
  );
}

function Section({
  number,
  title,
  problem,
  steps,
  note,
}: {
  number: string;
  title: string;
  problem: string;
  steps: string[];
  note?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-semibold tabular-nums text-accent-yellow">
          {number}
        </span>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-white/60">{problem}</p>
      <ol className="mt-4 space-y-2 pl-4">
        {steps.map((step, i) => (
          <li
            key={i}
            className="relative pl-5 text-sm text-white/80 before:absolute before:left-0 before:text-white/30 before:content-[counter(list-item)'.']"
            style={{ counterIncrement: "list-item" }}
          >
            {step}
          </li>
        ))}
      </ol>
      {note && (
        <p className="mt-3 rounded-lg bg-white/[0.03] px-4 py-3 text-xs text-white/50 ring-1 ring-white/5">
          💡 {note}
        </p>
      )}
    </div>
  );
}
