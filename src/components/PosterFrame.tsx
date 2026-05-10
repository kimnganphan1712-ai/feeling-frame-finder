import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "scrub" | "warm" | "navy" | "neutral";

interface PosterFrameProps {
  children?: ReactNode;
  src?: string | null;
  alt?: string;
  caption?: string;
  kicker?: string;
  aspect?: "square" | "video" | "portrait" | "wide" | "poster" | "auto";
  tone?: Tone;
  href?: string;
  onClick?: () => void;
  hover?: boolean;
  className?: string;
  overlayClassName?: string;
}

const aspectMap: Record<string, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[16/7]",
  poster: "aspect-[2/3]",
  auto: "",
};

const toneRing: Record<Tone, string> = {
  scrub: "ring-scrub/20",
  warm: "ring-warm/30",
  navy: "ring-navy/20",
  neutral: "ring-white/40",
};

const toneGlow: Record<Tone, string> = {
  scrub: "group-hover:shadow-[0_30px_60px_-25px_rgba(14,94,156,0.55)]",
  warm: "group-hover:shadow-[0_30px_60px_-25px_rgba(246,196,69,0.55)]",
  navy: "group-hover:shadow-[0_30px_60px_-25px_rgba(16,42,67,0.7)]",
  neutral: "group-hover:shadow-cinematic",
};

/**
 * Cinematic film-frame card. Wraps children OR an image.
 * Bo góc, viền mảnh, overlay tối nhẹ, film grain, hover zoom + glow.
 */
export function PosterFrame({
  children,
  src,
  alt,
  caption,
  kicker,
  aspect = "auto",
  tone = "neutral",
  href,
  onClick,
  hover = true,
  className,
  overlayClassName,
}: PosterFrameProps) {
  const isMedia = !!src;

  const inner = (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden rounded-[22px] sm:rounded-[28px]",
        "ring-1 ring-inset",
        toneRing[tone],
        "bg-card border border-border/60 shadow-card",
        "transition-all duration-500",
        hover && "group-hover:-translate-y-1 group-hover:scale-[1.01]",
        hover && toneGlow[tone],
      )}
    >
      {isMedia ? (
        <img
          src={src!}
          alt={alt ?? ""}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-transform duration-700",
            hover && "group-hover:scale-[1.06]",
          )}
          loading="lazy"
        />
      ) : null}

      {/* Children content (over image if any) */}
      {children ? (
        <div className={cn("relative z-10 w-full h-full", isMedia && "p-5 sm:p-6")}>{children}</div>
      ) : null}

      {/* Cinematic overlay + film grain — only when image */}
      {isMedia && (
        <>
          <div
            className={cn(
              "absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-navy/65 via-navy/15 to-transparent",
              overlayClassName,
            )}
          />
          <div
            className="absolute inset-0 z-[2] pointer-events-none opacity-[0.10] mix-blend-overlay"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px)",
              backgroundSize: "3px 3px",
            }}
          />
          {/* Inner film border */}
          <div className="absolute inset-2 z-[2] pointer-events-none rounded-[18px] border border-white/15" />
        </>
      )}

      {/* Caption / kicker overlay */}
      {(caption || kicker) && isMedia && (
        <div className="absolute z-[3] bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
          {kicker && (
            <p className="text-[10px] uppercase tracking-[0.3em] text-warm font-semibold mb-1">
              {kicker}
            </p>
          )}
          {caption && (
            <p className="font-display text-base sm:text-lg leading-snug drop-shadow">{caption}</p>
          )}
        </div>
      )}

      {/* Yellow corner accent */}
      <span className="absolute top-3 right-3 z-[3] w-2.5 h-2.5 rounded-full bg-warm/80 shadow-[0_0_12px_rgba(246,196,69,0.7)] opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );

  const wrapperClass = cn(
    "group relative block",
    aspectMap[aspect],
    onClick && "cursor-pointer",
    className,
  );

  if (href) {
    return (
      <a href={href} className={wrapperClass}>
        {inner}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(wrapperClass, "text-left")}>
        {inner}
      </button>
    );
  }
  return <div className={wrapperClass}>{inner}</div>;
}
