import Link from "next/link";

type RangeKey = "7d" | "2w" | "1m" | "all";

type Props = {
  current: RangeKey;
  steamid: string;
};

const OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "2w", label: "2 weeks" },
  { value: "1m", label: "1 month" },
  { value: "all", label: "all time" },
];

export default function RangeToggle({ current, steamid }: Props) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1 shadow-inner">
      {OPTIONS.map((opt) => {
        const active = current === opt.value;
        return (
          <Link
            key={opt.value}
            href={`/u/${steamid}?range=${opt.value}`}
            className={
              "rounded-full px-4 py-1.5 text-xs font-medium transition " +
              (active
                ? "bg-white text-ink shadow"
                : "text-white/70 hover:text-white")
            }
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
