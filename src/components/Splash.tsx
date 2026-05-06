import { useEffect, useState } from "react";
import { Mascot } from "./Mascot";

export function Splash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(3), 2400);
    const t4 = setTimeout(() => onDone(), 3400);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-welcome flex flex-col items-center justify-center overflow-hidden">
      {/* sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-mint-deep animate-sparkle"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              fontSize: `${10 + (i % 4) * 4}px`,
              animationDelay: `${(i * 0.18) % 3}s`,
              color: i % 2 ? "var(--blush-deep)" : "var(--mint-deep)",
            }}
          >
            ✦
          </span>
        ))}
      </div>

      <div className={`transition-all duration-700 ${phase >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
        <Mascot size="xl" variant="default" glow floating />
      </div>

      <h1
        className={`mt-8 text-4xl md:text-5xl font-semibold text-foreground transition-all duration-700 ${
          phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        Hospital Playlist
      </h1>
      <p
        className={`mt-2 text-mint-deep/80 text-sm md:text-base tracking-[0.2em] uppercase transition-all duration-700 delay-75 ${
          phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        Trạm Cứu Hộ Cảm Xúc
      </p>
      <p
        className={`mt-3 text-muted-foreground text-sm md:text-base transition-all duration-700 delay-100 ${
          phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        Hít một hơi thật sâu… bạn về đến nơi rồi.
      </p>

      <div
        className={`mt-10 w-48 h-1 rounded-full bg-mint/40 overflow-hidden transition-opacity duration-500 ${
          phase >= 1 && phase < 3 ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full bg-mint-deep rounded-full animate-[shimmer_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
      </div>

      <div className={`absolute inset-0 bg-background transition-opacity duration-700 pointer-events-none ${phase >= 3 ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
