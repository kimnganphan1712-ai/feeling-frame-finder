import { cn } from "@/lib/utils";
import { StickerOption, StickerFace } from "@/lib/stickers";

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
      aria-label={sticker.label}
      aria-pressed={selected}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full transition-all duration-300 select-none",
        isButton && "hover:scale-110 hover:-translate-y-0.5 cursor-pointer",
        selected && "scale-110 -translate-y-0.5",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 30%, color-mix(in oklab, ${sticker.color} 70%, white) 0%, ${sticker.color} 65%, color-mix(in oklab, ${sticker.color} 80%, black) 130%)`,
        boxShadow: selected
          ? `0 0 0 3px white, 0 0 0 5px #5EC9B7, 0 10px 28px -6px ${sticker.color}cc`
          : `inset 0 -3px 6px rgba(0,0,0,0.08), 0 4px 12px -4px ${sticker.color}80`,
      }}
    >
      {/* glossy highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          top: "10%",
          left: "18%",
          width: "32%",
          height: "22%",
          background: "radial-gradient(ellipse, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)",
          filter: "blur(0.4px)",
        }}
      />
      <FaceSvg face={sticker.face} size={Math.round(size * 0.7)} />
    </Comp>
  );
}

function FaceSvg({ face, size }: { face: StickerFace; size: number }) {
  const stroke = "#3B3340";
  const sw = Math.max(1.2, size * 0.045);
  const cheek = "#FF8FA3";
  const common = {
    fill: "none",
    stroke,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ overflow: "visible" }}>
      {renderEyebrows(face, common)}
      {renderEyes(face, stroke, sw)}
      {renderMouth(face, common)}
      {renderExtras(face, { stroke, sw, cheek })}
    </svg>
  );
}

function renderEyebrows(face: StickerFace, c: any) {
  switch (face) {
    case "anxious":
      return (
        <>
          <path d="M9 11 L13 10" {...c} />
          <path d="M19 10 L23 11" {...c} />
        </>
      );
    case "angry":
      return (
        <>
          <path d="M9 10 L13 12" {...c} />
          <path d="M19 12 L23 10" {...c} />
        </>
      );
    case "sad":
    case "tired":
      return (
        <>
          <path d="M9 11.5 Q11 10.5 13 11.5" {...c} />
          <path d="M19 11.5 Q21 10.5 23 11.5" {...c} />
        </>
      );
    case "stressed":
      return (
        <>
          <path d="M9.5 10.5 L12.5 11.5" {...c} />
          <path d="M19.5 11.5 L22.5 10.5" {...c} />
        </>
      );
    default:
      return null;
  }
}

function renderEyes(face: StickerFace, stroke: string, sw: number) {
  const dot = (cx: number, cy: number, r = 1.1) => (
    <circle cx={cx} cy={cy} r={r} fill={stroke} />
  );
  const closedEye = (cx: number, cy: number) => (
    <path d={`M${cx - 2} ${cy} Q${cx} ${cy + 1.6} ${cx + 2} ${cy}`} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
  );
  const sleepyEye = (cx: number, cy: number) => (
    <path d={`M${cx - 2} ${cy + 0.3} Q${cx} ${cy - 0.6} ${cx + 2} ${cy + 0.3}`} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
  );

  switch (face) {
    case "joy":
      // ^ ^ smiling eyes
      return (
        <>
          <path d="M9 14 Q11 12 13 14" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <path d="M19 14 Q21 12 23 14" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </>
      );
    case "calm":
      return (
        <>
          {closedEye(11, 14)}
          {closedEye(21, 14)}
        </>
      );
    case "grateful":
      return (
        <>
          {closedEye(11, 14)}
          {closedEye(21, 14)}
        </>
      );
    case "tired":
      return (
        <>
          {sleepyEye(11, 14.5)}
          {sleepyEye(21, 14.5)}
        </>
      );
    case "anxious":
      // wide eyes with small pupils
      return (
        <>
          <circle cx={11} cy={14.5} r={2} fill="white" stroke={stroke} strokeWidth={sw * 0.6} />
          <circle cx={21} cy={14.5} r={2} fill="white" stroke={stroke} strokeWidth={sw * 0.6} />
          {dot(11, 14.5, 0.8)}
          {dot(21, 14.5, 0.8)}
        </>
      );
    case "angry":
      return (
        <>
          {dot(11, 14.5, 1.2)}
          {dot(21, 14.5, 1.2)}
        </>
      );
    case "empty":
      // tiny dot eyes — vacant
      return (
        <>
          {dot(11, 14.5, 0.7)}
          {dot(21, 14.5, 0.7)}
        </>
      );
    case "stressed":
      // squinted x-ish but soft: short crosses
      return (
        <>
          <path d={`M9.5 13.5 L12.5 15`} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M9.5 15 L12.5 13.5`} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M19.5 13.5 L22.5 15`} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <path d={`M19.5 15 L22.5 13.5`} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </>
      );
    case "hopeful":
      // sparkly eyes — dot + small star highlight
      return (
        <>
          {dot(11, 14.5, 1.3)}
          {dot(21, 14.5, 1.3)}
          <circle cx={11.6} cy={13.9} r={0.4} fill="white" />
          <circle cx={21.6} cy={13.9} r={0.4} fill="white" />
        </>
      );
    case "sad":
      return (
        <>
          {dot(11, 15, 1)}
          {dot(21, 15, 1)}
        </>
      );
  }
}

function renderMouth(face: StickerFace, c: any) {
  switch (face) {
    case "joy":
      return <path d="M11 19 Q16 23.5 21 19" {...c} fill="#FF8FA3" stroke={c.stroke} />;
    case "calm":
      return <path d="M13 20 Q16 21.5 19 20" {...c} />;
    case "grateful":
      return <path d="M13 20 Q16 21.8 19 20" {...c} />;
    case "sad":
      return <path d="M12 21.5 Q16 19 20 21.5" {...c} />;
    case "tired":
      return <path d="M13 21 Q16 20.2 19 21.2" {...c} />;
    case "anxious":
      return <path d="M14 20.5 Q16 19.7 18 20.5" {...c} />;
    case "angry":
      return <path d="M12 21 Q16 19 20 21" {...c} />;
    case "empty":
      return <path d="M13 20.5 L19 20.5" {...c} />;
    case "stressed":
      return <path d="M13 21 Q14.5 20 16 21 Q17.5 22 19 21" {...c} />;
    case "hopeful":
      return <path d="M12.5 19.5 Q16 22 19.5 19.5" {...c} />;
  }
}

function renderExtras(
  face: StickerFace,
  { stroke, sw, cheek }: { stroke: string; sw: number; cheek: string },
) {
  switch (face) {
    case "joy":
      return (
        <>
          <ellipse cx={8} cy={18} rx={1.6} ry={1} fill={cheek} opacity={0.8} />
          <ellipse cx={24} cy={18} rx={1.6} ry={1} fill={cheek} opacity={0.8} />
        </>
      );
    case "grateful":
      return (
        <>
          <ellipse cx={8} cy={18} rx={1.6} ry={1} fill={cheek} opacity={0.85} />
          <ellipse cx={24} cy={18} rx={1.6} ry={1} fill={cheek} opacity={0.85} />
          {/* small hearts */}
          <path d="M5 9 c-0.6 -0.8 -1.8 0 -1.2 0.9 c0.3 0.5 1.2 1.1 1.2 1.1 s0.9 -0.6 1.2 -1.1 c0.6 -0.9 -0.6 -1.7 -1.2 -0.9 z" fill="#FF6B8A" />
          <path d="M27 8 c-0.5 -0.7 -1.5 0 -1 0.8 c0.25 0.4 1 0.9 1 0.9 s0.75 -0.5 1 -0.9 c0.5 -0.8 -0.5 -1.5 -1 -0.8 z" fill="#FF6B8A" />
        </>
      );
    case "sad":
      return (
        <path d="M13 17.5 q-0.6 1.5 0 2.4 q0.6 -0.9 0 -2.4 z" fill="#7FB6E8" />
      );
    case "tired":
      return (
        <>
          {/* sweat drop */}
          <path d="M23.5 10 q-0.7 1.5 0 2.4 q0.7 -0.9 0 -2.4 z" fill="#7FB6E8" />
          {/* under-eye shade */}
          <path d="M9 16.2 L13 16.2" fill="none" stroke={stroke} strokeWidth={sw * 0.6} strokeLinecap="round" opacity={0.4} />
          <path d="M19 16.2 L23 16.2" fill="none" stroke={stroke} strokeWidth={sw * 0.6} strokeLinecap="round" opacity={0.4} />
        </>
      );
    case "anxious":
      return (
        <>
          {/* wiggle lines */}
          <path d="M4 14 q1 -1 2 0 q1 1 2 0" fill="none" stroke={stroke} strokeWidth={sw * 0.7} strokeLinecap="round" opacity={0.7} />
          <path d="M24 14 q1 -1 2 0 q1 1 2 0" fill="none" stroke={stroke} strokeWidth={sw * 0.7} strokeLinecap="round" opacity={0.7} />
        </>
      );
    case "angry":
      return (
        // small steam puff
        <path d="M5 8 q1 -1.2 2 0 q1 1.2 2 0" fill="none" stroke="#C26B66" strokeWidth={sw * 0.8} strokeLinecap="round" />
      );
    case "stressed":
      return (
        <path d="M24 9 q-0.8 1.7 0 2.7 q0.8 -1 0 -2.7 z" fill="#7FB6E8" />
      );
    case "hopeful":
      return (
        <>
          {/* sparkles */}
          <Sparkle x={5} y={9} size={2.4} />
          <Sparkle x={26} y={8} size={2} />
          <Sparkle x={27} y={20} size={1.6} />
          <ellipse cx={8.5} cy={18.5} rx={1.4} ry={0.9} fill={cheek} opacity={0.7} />
          <ellipse cx={23.5} cy={18.5} rx={1.4} ry={0.9} fill={cheek} opacity={0.7} />
        </>
      );
    default:
      return null;
  }
}

function Sparkle({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size;
  return (
    <path
      d={`M${x} ${y - s} L${x + s * 0.35} ${y - s * 0.35} L${x + s} ${y} L${x + s * 0.35} ${y + s * 0.35} L${x} ${y + s} L${x - s * 0.35} ${y + s * 0.35} L${x - s} ${y} L${x - s * 0.35} ${y - s * 0.35} Z`}
      fill="#FFE680"
      stroke="#F5C84A"
      strokeWidth={0.3}
    />
  );
}
