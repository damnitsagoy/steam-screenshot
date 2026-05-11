import Link from "next/link";

type Props = {
  current: "recent" | "alltime";
  steamid: string;
};

export default function RangeToggle({ current, steamid }: Props) {
  const Opt = ({
    value,
    label,
  }: {
    value: "recent" | "alltime";
    label: string;
  }) => {
    const active = current === value;
    return (
      <Link
        href={`/u/${steamid}?range=${value}`}
        className={
          "border px-4 py-2 font-mono text-xs uppercase tracking-widest transition " +
          (active
            ? "border-phosphor bg-phosphor text-bg shadow-phosphor"
            : "border-phosphor-dim text-phosphor-dim hover:border-phosphor hover:text-phosphor")
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex gap-2">
      <Opt value="recent" label="last 2 weeks" />
      <Opt value="alltime" label="all-time top 10" />
    </div>
  );
}
