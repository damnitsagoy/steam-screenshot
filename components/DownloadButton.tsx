"use client";

import { useState } from "react";

type Props = {
  targetId: string;
  filename: string;
};

const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1920;

/**
 * Export the receipt card as a 1080x1920 PNG.
 *
 * On mobile (especially iOS Safari), html-to-image is fragile when asked
 * to scale up a small visible element by a large pixelRatio -- it can
 * produce blank regions, blurry text, or run out of memory. To sidestep
 * that, we:
 *
 *  1. Clone the card into an off-screen container that is already exactly
 *     1080px wide -- so the PNG is captured at 1:1 regardless of viewport.
 *  2. Wait for every <img> inside the clone to finish loading before
 *     capturing, so no thumbnails render as broken.
 *  3. Render with pixelRatio=1 since the clone is already the right size.
 */
export default function DownloadButton({ targetId, filename }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleDownload() {
    setErr(null);
    setBusy(true);

    let offscreen: HTMLDivElement | null = null;

    try {
      const node = document.getElementById(targetId);
      if (!node) throw new Error(`no element with id="${targetId}"`);

      // Build an off-screen container sized exactly for the PNG.
      offscreen = document.createElement("div");
      offscreen.style.position = "fixed";
      offscreen.style.top = "0";
      offscreen.style.left = "0";
      offscreen.style.width = `${EXPORT_WIDTH}px`;
      offscreen.style.height = `${EXPORT_HEIGHT}px`;
      offscreen.style.pointerEvents = "none";
      offscreen.style.opacity = "0";
      offscreen.style.zIndex = "-1";
      offscreen.style.transform = "translateX(-200%)"; // extra safety

      const clone = node.cloneNode(true) as HTMLElement;
      // Force clone to render at the export size exactly.
      clone.style.width = `${EXPORT_WIDTH}px`;
      clone.style.maxWidth = "none";
      clone.style.height = `${EXPORT_HEIGHT}px`;
      // Strip the id so we don't have two elements with the same id in
      // the DOM while we work.
      clone.removeAttribute("id");
      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      // Wait for all images in the clone to finish loading.
      await Promise.all(
        Array.from(clone.querySelectorAll("img")).map(waitForImage)
      );

      // One more frame to make sure layout has settled at the new size.
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const { toPng } = await import("html-to-image");

      const dataUrl = await toPng(clone, {
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: "#0f0a0f",
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
      });

      triggerDownload(dataUrl, filename);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "download failed");
    } finally {
      if (offscreen && offscreen.parentNode) {
        offscreen.parentNode.removeChild(offscreen);
      }
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

function waitForImage(img: HTMLImageElement): Promise<void> {
  // Make sure anonymous CORS is set so the image can be painted to canvas.
  if (!img.crossOrigin) img.crossOrigin = "anonymous";
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      resolve();
    };
    img.addEventListener("load", done);
    img.addEventListener("error", done); // resolve even on error; skip missing
  });
}

function triggerDownload(dataUrl: string, filename: string) {
  // Mobile Safari sometimes refuses programmatic <a download> taps when the
  // element is created and clicked synchronously inside a long async flow.
  // Opening in a new tab is a reliable fallback on iOS.
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.rel = "noopener";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
