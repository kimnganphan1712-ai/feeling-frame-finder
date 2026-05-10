import { useEffect, useState, type ReactNode } from "react";
import { siteImagesStore } from "@/lib/site-images-store";
import { cn } from "@/lib/utils";

interface Props {
  slot: string;
  fallbackSrc: string;
  kicker: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  height?: "sm" | "md" | "lg";
}

const heightMap = {
  sm: "min-h-[260px] sm:min-h-[320px]",
  md: "min-h-[320px] sm:min-h-[420px]",
  lg: "min-h-[400px] sm:min-h-[520px]",
};

/**
 * Cinematic film-frame banner used at the top of utility pages.
 * Loads the first image from `slot`; falls back to a packaged image.
 */
export function CinematicBanner({ slot, fallbackSrc, kicker, title, subtitle, children, height = "md" }: Props) {
  const [src, setSrc] = useState<string>(fallbackSrc);

  useEffect(() => {
    let alive = true;
    siteImagesStore.firstUrl(slot, fallbackSrc).then((u) => {
      if (alive && u) setSrc(u);
    });
    return () => {
      alive = false;
    };
  }, [slot, fallbackSrc]);

  return (
    <section
      className={cn(
        "relative -mx-5 sm:mx-0 sm:rounded-[28px] overflow-hidden shadow-cinematic ring-1 ring-inset ring-white/10 animate-[fade-up_0.6s_ease-out]",
        heightMap[height],
      )}
    >
      <img
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/45 to-navy/15" />
      <div
        className="absolute inset-0 opacity-[0.10] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      <div className="absolute inset-3 sm:inset-4 rounded-[22px] border border-white/15 pointer-events-none" />

      <div className="relative h-full px-6 sm:px-10 py-12 sm:py-16 flex flex-col justify-end max-w-3xl">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-warm font-semibold">
          {kicker}
        </p>
        <h1 className="mt-3 heading-cinematic text-white text-[2rem] sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 font-serif italic text-white/85 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </section>
  );
}
