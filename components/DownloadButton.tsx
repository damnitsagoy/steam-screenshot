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

      const { toPng } = await import("html-to-image");

      // Target a 1080x1920 export regardless of on-screen size.
      const rect = node.getBoundingClientRect();
      const targetWidth = 1080;
      const pixelRatio = targetWidth / rect.width;

      const dataUrl = await toPng(node, {
        pixelRatio,
        cacheBust: true,
        backgroundColor: "#0f0a0f",
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
        className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-ink shadow-lg transition hover:bg-white/90 disabled:opacity-50"
      >
        {busy ? "Rendering..." : "Download PNG"}
      </button>
      {err && <p className="text-xs text-red-300">{err}</p>}
    </div>
  );
}
