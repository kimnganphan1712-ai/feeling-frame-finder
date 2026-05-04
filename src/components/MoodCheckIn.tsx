import { useState } from "react";
import { MOODS, MoodKey, getMoodMessage } from "@/lib/mood";
import { Mascot } from "./Mascot";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function MoodCheckIn({ onDone }: { onDone: (mood: MoodKey) => void | Promise<void> }) {
  const [selected, setSelected] = useState<MoodKey | null>(null);
  const [thinking, setThinking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSelect = (mood: MoodKey) => {
    setSelected(mood);
    setThinking(true);
    setTimeout(() => {
      setMessage(getMoodMessage(mood));
      setThinking(false);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-welcome/80 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-up_0.5s_ease-out]">
      <div className="glass-strong rounded-3xl shadow-soft max-w-lg w-full p-8 md:p-10 relative">
        <div className="flex flex-col items-center text-center">
          <Mascot size="md" floating />

          {!message && (
            <>
              <h2 className="mt-6 text-2xl md:text-3xl font-semibold">Hôm nay của bạn thế nào?</h2>
              <p className="mt-2 text-muted-foreground text-sm">Chọn một màu mà cảm xúc của bạn đang ngả về.</p>

              <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                {MOODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => handleSelect(m.key)}
                    disabled={thinking}
                    className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 text-left
                      ${selected === m.key ? "scale-105 shadow-soft" : "hover:scale-[1.02] hover:shadow-card border-transparent"}
                    `}
                    style={{
                      background: selected === m.key
                        ? `color-mix(in oklch, ${m.colorVar} 30%, white)`
                        : `color-mix(in oklch, ${m.colorVar} 15%, white)`,
                      borderColor: selected === m.key ? m.colorVar : "transparent",
                    }}
                  >
                    <div className="text-3xl mb-1">{m.emoji}</div>
                    <div className="font-semibold text-foreground">{m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.description}</div>
                  </button>
                ))}
              </div>

              {thinking && (
                <div className="mt-6 flex items-center gap-2 text-mint-deep animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Mascot đang lắng nghe bạn…</span>
                </div>
              )}
            </>
          )}

          {message && selected && (
            <div className="mt-6 animate-[fade-up_0.6s_ease-out]">
              <div className="inline-flex items-center gap-2 text-xs text-mint-deep mb-3">
                <Sparkles className="w-3 h-3" /> Lời nhắn dành cho bạn
              </div>
              <p className="text-foreground/90 leading-relaxed text-base md:text-lg italic">
                "{message}"
              </p>
              <Button
                onClick={() => onDone(selected)}
                className="mt-8 rounded-full px-8 bg-mint-deep hover:bg-mint-deep/90 text-primary-foreground"
              >
                Cảm ơn, mình vào trong nhé
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
