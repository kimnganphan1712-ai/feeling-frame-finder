import { Music2, Heart, Plus, Sparkles } from "lucide-react";

/**
 * Soft cinematic background: blurred pastel blobs + slow drifting
 * music notes / hearts / medical plus / sparkles. Pointer-events: none.
 */
export function BackgroundDecor() {
  return (
    <div className="bg-decor" aria-hidden>
      {/* Pastel blobs */}
      <span
        className="bg-decor-blob"
        style={{
          width: 380, height: 380, top: "-80px", left: "-100px",
          background: "color-mix(in oklch, var(--scrub-blue) 35%, white)",
          animation: "drift 24s ease-in-out infinite",
        }}
      />
      <span
        className="bg-decor-blob"
        style={{
          width: 320, height: 320, top: "30%", right: "-90px",
          background: "color-mix(in oklch, var(--warm-yellow) 45%, white)",
          animation: "drift-rev 28s ease-in-out infinite",
        }}
      />
      <span
        className="bg-decor-blob"
        style={{
          width: 260, height: 260, bottom: "-60px", left: "30%",
          background: "color-mix(in oklch, var(--scrub-blue) 28%, white)",
          animation: "drift 32s ease-in-out infinite",
        }}
      />

      {/* Floating icons */}
      <Music2
        className="bg-decor-float w-7 h-7"
        style={{ top: "12%", left: "8%", animation: "drift 22s ease-in-out infinite" }}
        strokeWidth={1.4}
      />
      <Heart
        className="bg-decor-float w-6 h-6"
        style={{
          top: "22%", right: "12%",
          color: "color-mix(in oklch, var(--warm-yellow) 70%, white)",
          animation: "drift-rev 26s ease-in-out infinite",
        }}
        strokeWidth={1.4}
      />
      <Plus
        className="bg-decor-float w-7 h-7"
        style={{ top: "55%", left: "6%", animation: "drift-rev 30s ease-in-out infinite" }}
        strokeWidth={1.4}
      />
      <Sparkles
        className="bg-decor-float w-6 h-6"
        style={{
          top: "70%", right: "10%",
          color: "color-mix(in oklch, var(--warm-yellow) 70%, white)",
          animation: "drift 24s ease-in-out infinite",
        }}
        strokeWidth={1.4}
      />
      <Music2
        className="bg-decor-float w-5 h-5"
        style={{ bottom: "12%", left: "45%", animation: "drift-rev 28s ease-in-out infinite" }}
        strokeWidth={1.4}
      />

      {/* Tiny twinkling dots */}
      {[
        { t: "18%", l: "30%", d: "0s" },
        { t: "40%", l: "70%", d: "0.8s" },
        { t: "65%", l: "25%", d: "1.6s" },
        { t: "80%", l: "60%", d: "0.4s" },
      ].map((s, i) => (
        <span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            top: s.t, left: s.l,
            background: "color-mix(in oklch, var(--warm-yellow) 80%, white)",
            boxShadow: "0 0 12px rgba(246,196,69,0.7)",
            animation: `sparkle 3s ease-in-out ${s.d} infinite`,
          }}
        />
      ))}
    </div>
  );
}
