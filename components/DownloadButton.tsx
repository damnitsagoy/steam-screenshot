"use client";

import { useState } from "react";

type Props = {
  targetId: string;
  filename: string;
};

export default function DownloadButton({ targetId, filename }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleDownload() {
    setErr(null);
    setBusy(true);
    try {
      const node = document.getElementById(targetId);
      if (!node) throw new Error(`no element with id="${targetId}"`);

      // Dynamic import so the library isn't in the server bundle.
      const { toPng } = await import("html-to-image");

      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#05080a",
        // Tell html-to-image to skip remote images that fail CORS,
        // rather than aborting the whole render.
        skipFonts: false,
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "download failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={busy}
        className="inline-flex items-center gap-2 border border-phosphor bg-panel px-5 py-2 font-mono text-xs uppercase tracking-widest text-phosphor shadow-phosphor transition hover:bg-phosphor hover:text-bg disabled:opacity-50"
      >
        {busy ? "> rendering..." : "[ download png ]"}
      </button>
      {err && (
        <p className="font-mono text-xs text-phosphor-red">&gt; ERR: {err}</p>
      )}
    </div>
  );
}
