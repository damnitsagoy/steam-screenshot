"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Props = {
  /** Design-pixel width of the inner content (e.g. 540). */
  designWidth: number;
  /** Design-pixel height of the inner content (e.g. 960). */
  designHeight: number;
  /** Max width the scaled preview may occupy on screen. */
  maxWidth?: number;
  children: ReactNode;
  className?: string;
};

/**
 * Renders children at fixed design dimensions and scales them visually
 * (via CSS transform) to fit the available width, preserving aspect ratio.
 *
 * This is the standard "share-card" pattern: the inner layout is always
 * pixel-perfect at one size, so content never overflows or rescales
 * weirdly on phones. The visible preview just resizes via transform,
 * which does not affect the DOM layout sizes -- meaning html-to-image
 * can snapshot the children at their design size regardless of the
 * user's viewport.
 */
export default function ScaleToFit({
  designWidth,
  designHeight,
  maxWidth,
  children,
  className,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0); // 0 = not measured yet

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      setScale(rect.width / designWidth);
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [designWidth]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        width: "100%",
        maxWidth,
        aspectRatio: `${designWidth} / ${designHeight}`,
        position: "relative",
        overflow: "hidden",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale || 1})`,
          transformOrigin: "top left",
          // Fade in once we've measured to avoid a brief "too big" flash.
          opacity: scale === 0 ? 0 : 1,
          transition: "opacity 120ms ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
