import { cn } from "@/lib/utils";
import { StickerOption } from "@/lib/stickers";

interface Props {
  sticker: StickerOption;
  size?: number; // px
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
}

// Hand-drawn-feel face rendered as SVG so it scales beautifully
export function MoodSticker({ sticker, size = 56, selected, onClick, className, title }: Props) {
  const isButton = !!onClick;
  const Comp = (isButton ? "button" : "div") as "button" | "div";

  return (
    <Comp
      type={isButton ? "button" : undefined}
      onClick={onClick}
      title={title ?? sticker.label}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full transition-all duration-300 select-none",
        isButton && "hover:scale-110 cursor-pointer",
        selected && "scale-110",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: sticker.color,
        boxShadow: selected
          ? `0 0 0 3px white, 0 0 0 5px ${sticker.color}, 0 8px 24px -6px ${sticker.color}99`
          : "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      <FaceSvg face={sticker.face} size={Math.round(size * 0.55)} />
    </Comp>
  );
}

function FaceSvg({ face, size }: { face: StickerOption["face"]; size: number }) {
  // hand-drawn faces, white strokes
  const stroke = "#ffffff";
  const sw = Math.max(1.4, size * 0.06);
  const common = {
    fill: "none",
    stroke,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {/* eyes */}
      {face === "blank" || face === "special" ? (
        <>
          <line x1="8.5" y1="10" x2="9.5" y2="10" {...common} />
          <line x1="14.5" y1="10" x2="15.5" y2="10" {...common} />
        </>
      ) : (
        <>
          <circle cx="9" cy="10" r="0.9" fill={stroke} />
          <circle cx="15" cy="10" r="0.9" fill={stroke} />
        </>
      )}
      {/* mouth */}
      {face === "smile" && <path d="M8.5 14.5 Q12 17.5 15.5 14.5" {...common} />}
      {face === "calm" && <path d="M9 15 Q12 16.4 15 15" {...common} />}
      {face === "soft" && <path d="M9 15 Q12 16 15 15" {...common} />}
      {face === "stress" && <path d="M8.5 16 Q12 13 15.5 16" {...common} />}
      {face === "worry" && <path d="M9 15.5 Q10.5 14.2 12 15.5 Q13.5 16.8 15 15.5" {...common} />}
      {face === "blank" && <line x1="9" y1="15.2" x2="15" y2="15.2" {...common} />}
      {face === "special" && <path d="M9 15.5 Q12 14.5 15 15.5" {...common} />}
    </svg>
  );
}
