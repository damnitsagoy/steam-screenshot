"use client";

import { useState } from "react";

type Props = {
  targetId: string;
  filename: string;
};

/**
 * Export the receipt card as a 1080x1920 PNG.
 *
 * ## The race-condition problem we're solving
 *
 * html-to-image, when given a node with multiple <img> elements, has to
 * fetch each image and inline it as a data URL so the canvas can paint
 * it without cross-origin issues. On mobile (especially iOS Safari),
 * that concurrent fetching has a nasty race: the *last* fetch to resolve
 * can end up painted onto multiple <img> slots, producing a card where
 * every thumbnail shows the same game's art.
 *
 * The fix is to not let html-to-image do the fetching at all. We:
 *   1. Gather every unique image URL in the card.
 *   2. Fetch each one ourselves, convert to an independent data URL.
 *   3. Rewrite the cloned DOM so every <img src> and every
 *      background-image URL points to its own data URL.
 *   4. Pass the clone (with all assets inlined) to html-to-image.
 *
 * At that point html-to-image has zero network work to do and zero
 * possibility of mixing up which bytes belong to which <img>.
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

      // Clone at the design size, no transforms.
      const clone = node.cloneNode(true) as HTMLElement;
      clone.removeAttribute("id");

      // Pre-fetch every unique image URL in the clone, convert to data URLs,
      // and rewrite the src attributes. This sidesteps html-to-image's race
      // condition that was causing thumbnails to all show the same game.
      await inlineAllImages(clone);

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
        transform: "translateX(-200%)", // extra safety
      });
      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      // Let the browser lay out the inlined images.
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await Promise.all(
        Array.from(clone.querySelectorAll("img")).map(waitForImage)
      );
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const { toPng } = await import("html-to-image");

      const dataUrl = await toPng(clone, {
        pixelRatio: PIXEL_RATIO,
        cacheBust: false,
        backgroundColor: "#0f0a0f",
        width: DESIGN_WIDTH,
        height: DESIGN_HEIGHT,
        // Every <img> in the clone is already a data URL, so fetchRequestInit
        // and skipAutoScale don't matter. But give html-to-image a no-op
        // fetcher just in case it still tries to resolve an asset.
        fetchRequestInit: { cache: "force-cache" },
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

/**
 * Collect every unique image URL referenced in the clone (from <img src>
 * and inline `background-image: url(...)` styles), fetch each one exactly
 * once, convert to a data URL, and rewrite every reference to use the
 * data URL.
 *
 * This is the core fix for the "all thumbnails show one game" bug --
 * by the time html-to-image looks at the DOM, every image is already
 * self-contained bytes with its own independent data URL.
 */
async function inlineAllImages(root: HTMLElement): Promise<void> {
  // Collect references. We record each one individually so we can rewrite
  // each <img> independently even if two <img>s share the same URL.
  const imgEls = Array.from(root.querySelectorAll("img"));
  const bgEls: { el: HTMLElement; url: string }[] = [];
  for (const el of Array.from(
    root.querySelectorAll<HTMLElement>("[style]")
  )) {
    const bg = el.style.backgroundImage;
    if (!bg) continue;
    const match = bg.match(/url\((['"]?)([^'")]+)\1\)/);
    if (match) bgEls.push({ el, url: match[2] });
  }

  // Unique URLs -> Promise<dataUrl>.
  const urls = new Set<string>();
  for (const img of imgEls) {
    if (img.src) urls.add(img.src);
  }
  for (const { url } of bgEls) urls.add(url);

  const entries = await Promise.all(
    Array.from(urls).map(async (url) => {
      const dataUrl = await urlToDataUrl(url);
      return [url, dataUrl] as const;
    })
  );
  const map = new Map(entries);

  // Rewrite <img> src (and remove srcset so the browser can't pick an
  // alternate source and defeat our inlining).
  for (const img of imgEls) {
    if (!img.src) continue;
    const dataUrl = map.get(img.src);
    if (!dataUrl) continue;
    img.removeAttribute("srcset");
    img.removeAttribute("crossorigin");
    img.src = dataUrl;
  }

  // Rewrite background-image URLs.
  for (const { el, url } of bgEls) {
    const dataUrl = map.get(url);
    if (!dataUrl) continue;
    el.style.backgroundImage = `url("${dataUrl}")`;
  }
}

/** Fetch an image URL and convert to a base64 data URL. */
async function urlToDataUrl(url: string): Promise<string> {
  // If it's already a data URL, pass through.
  if (url.startsWith("data:")) return url;

  try {
    const res = await fetch(url, { cache: "force-cache", mode: "cors" });
    if (!res.ok) return url; // let the original URL stand; better than nothing
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch {
    return url;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      resolve();
    };
    img.addEventListener("load", done);
    img.addEventListener("error", done);
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
