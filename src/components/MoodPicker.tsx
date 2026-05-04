import { MOODS, MoodKey } from "@/lib/mood";
import { cn } from "@/lib/utils";

interface Props {
  value: MoodKey | null;
  onChange: (m: MoodKey) => void;
  size?: "sm" | "md";
}

export function MoodPicker({ value, onChange, size = "md" }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {MOODS.map((m) => {
        const active = value === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange(m.key)}
            title={m.label}
            className={cn(
              "rounded-full flex items-center justify-center border-2 transition-all duration-200",
              size === "sm" ? "w-9 h-9 text-lg" : "w-11 h-11 text-xl",
              active ? "scale-110 shadow-soft" : "hover:scale-105 border-transparent opacity-70 hover:opacity-100",
            )}
            style={{
              background: `color-mix(in oklch, ${m.colorVar} ${active ? 60 : 30}%, white)`,
              borderColor: active ? m.colorVar : "transparent",
            }}
          >
            {m.emoji}
          </button>
        );
      })}
    </div>
  );
}
