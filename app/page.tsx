import Link from "next/link";
import { getSessionSteamId } from "@/lib/session";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const sp = await searchParams;
  const existing = await getSessionSteamId();
  const authFailed = sp?.auth === "failed";

  return (
    <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16">
      <div className="scanbeam animate-scan" />
      <div className="pointer-events-none absolute inset-0 scanlines crt-vignette" />

      <div className="relative z-10 w-full">
        <pre className="crt-text font-terminal text-3xl leading-none sm:text-5xl">
{`  ____  _____  _____    _    __  __
 / ___||_   _|| ____|  / \\  |  \\/  |
 \\___ \\  | |  |  _|   / _ \\ | |\\/| |
  ___) | | |  | |___ / ___ \\| |  | |
 |____/  |_|  |_____/_/   \\_\\_|  |_|
        //  R E P L A Y`}
        </pre>

        <p className="crt-text mt-8 max-w-xl font-mono text-sm text-phosphor-dim">
          &gt; a retro-terminal printout of your recent Steam games.
          <br />
          &gt; sign in with Steam, generate your receipt, download a PNG.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="/api/auth/steam"
            className="crt-text inline-flex items-center gap-2 border border-phosphor bg-panel px-5 py-3 font-mono text-sm uppercase tracking-widest text-phosphor shadow-phosphor transition hover:bg-phosphor hover:text-bg"
          >
            [ sign in through steam ]
          </a>

          {existing && (
            <Link
              href={`/u/${existing}`}
              className="crt-text inline-flex items-center gap-2 border border-phosphor-dim px-5 py-3 font-mono text-sm uppercase tracking-widest text-phosphor-dim hover:border-phosphor hover:text-phosphor"
            >
              [ view my receipt ]
            </Link>
          )}
        </div>

        {authFailed && (
          <p className="mt-6 font-mono text-sm text-phosphor-red">
            &gt; ERR: steam openid verification failed. try again.
          </p>
        )}

        <div className="crt-text mt-16 font-mono text-xs leading-relaxed text-phosphor-dim">
          <p>&gt; not affiliated with valve or steam.</p>
          <p>
            &gt; we only read public profile + recent games. no password is
            ever asked.
          </p>
          <p className="mt-2">
            <span className="animate-blink">_</span>
          </p>
        </div>
      </div>
    </main>
  );
}
