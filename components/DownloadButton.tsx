"use client";

import { useState } from "react";

type Props = {
  targetId: string;
  filename: string;
};

/**
 * Export the receipt card as a 1080x1920 PNG.
 *
 * The card lives inside a <ScaleToFit> wrapper which visually scales it
 * via CSS transform. We don't want to capture the transformed version
 * because (a) transforms make html-to-image's geometry math brittle,
 * especially on mobile Safari, and (b) the bounding rect is wrong.
 *
 * Instead, we:
 *  1. Clone the card into an off-screen container at its natural design
 *     size (540x960) with no transforms.
 *  2. Wait for all <img>s to load (otherwise on mobile you can get a PNG
 *     with missing thumbnails or background).
 *  3. Wait for document.fonts.ready so Inter/Space Grotesk are actually
 *     rendered (not the sans-serif fallback).
 *  4. Snapshot at pixelRatio: 2 -> exactly 1080x1920.
 *
 * A download anchor is clicked with rel=noopener + target=_blank so iOS
 * Safari reliably triggers the save (it can be finicky with same-tab
 * downloads from async flows).
 */
const DESIGN_WIDTH = 540;
const DESIGN_HEIGHT = 960;
const PIXEL_RATIO = 2; // -> 1080x1920 PNG

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

      // Wait for web fonts to be ready before we clone, so the clone picks
      // up the real font faces rather than fallback sans-serif.
      if (typeof document !== "undefined" && "fonts" in document) {
        await document.fonts.ready;
      }

      // Build an off-screen container sized exactly for the design.
      offscreen = document.createElement("div");
      Object.assign(offscreen.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: `${DESIGN_WIDTH}px`,
        height: `${DESIGN_HEIGHT}px`,
        pointerEvents: "none",
        opacity: "0",
        zIndex: "-1",
        // Push it off-screen so it doesn't flash.
        transform: "translateX(-200%)",
      });

      const clone = node.cloneNode(true) as HTMLElement;
      // The card already has width/height baked into its style attribute
      // at the design size, so no further sizing is needed. Clear any id
      // to avoid DOM id collisions.
      clone.removeAttribute("id");
      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      // Wait for all images inside the clone to finish loading. Without
      // this, on a cold cache (first-time mobile users), the PNG can come
      // out with missing thumbnails or no background.
      await Promise.all(
        Array.from(clone.querySelectorAll("img")).map(waitForImage)
      );

      // Give layout one more frame to settle.
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const { toPng } = await import("html-to-image");

      const dataUrl = await toPng(clone, {
        pixelRatio: PIXEL_RATIO,
        cacheBust: false, // avoid query-string cache misses on Steam CDN
        backgroundColor: "#0f0a0f",
        width: DESIGN_WIDTH,
        height: DESIGN_HEIGHT,
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
  // Ensure CORS is requested so the canvas isn't tainted when we export.
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
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.rel = "noopener";
  // Opening in a new tab makes iOS Safari reliably fire the save flow,
  // where same-tab downloads from long async chains sometimes silently fail.
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
