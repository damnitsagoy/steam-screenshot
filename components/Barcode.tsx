/**
 * A decorative barcode that encodes a URL as varying-width bars.
 * This is NOT a real scannable barcode — it's a visual accent meant
 * to evoke the receiptify aesthetic. The bars are deterministically
 * generated from the URL string so the pattern is unique per site.
 *
 * Renders as an inline SVG so html-to-image captures it perfectly.
 */

type Props = {
  url: string;
  width?: number;
  height?: number;
  className?: string;
};

export default function Barcode({
  url,
  width = 200,
  height = 40,
  className,
}: Props) {
  const bars = generateBars(url, width);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      aria-hidden
    >
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={0}
          width={bar.w}
          height={height}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

function generateBars(
  input: string,
  totalWidth: number
): { x: number; w: number }[] {
  // Simple hash-based pattern: each character in the URL determines
  // a bar width (1–3px) and gap (1–2px).
  const bars: { x: number; w: number }[] = [];
  let x = 4; // small padding
  let i = 0;

  while (x < totalWidth - 4) {
    const charCode = input.charCodeAt(i % input.length);
    const barWidth = 1 + (charCode % 3); // 1, 2, or 3
    const gap = 1 + (charCode % 2); // 1 or 2

    if (x + barWidth > totalWidth - 4) break;

    bars.push({ x, w: barWidth });
    x += barWidth + gap;
    i++;
  }

  return bars;
}
