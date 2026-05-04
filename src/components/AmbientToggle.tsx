import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ambient sound generator using Web Audio API — soft pad-like tones.
 * No mp3 file required, no external assets. Toggle ON/OFF with persistence.
 */
export function AmbientToggle({ className }: { className?: string }) {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("tramdiu_ambient");
    if (saved === "on") setOn(true);
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = () => {
    if (nodesRef.current) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx: AudioContext = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.2);
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.7;
    filter.connect(master);

    // Soft chord: A3, C#4, E4, A4
    const freqs = [220, 277.18, 329.63, 440];
    const oscs = freqs.map((f) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.25;
      // gentle LFO
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08 + Math.random() * 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.06;
      lfo.connect(lfoGain).connect(g.gain);
      lfo.start();
      o.connect(g).connect(filter);
      o.start();
      return { o, lfo };
    });

    nodesRef.current = {
      stop: () => {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        setTimeout(() => {
          oscs.forEach(({ o, lfo }) => { try { o.stop(); lfo.stop(); } catch {} });
        }, 600);
      },
    };
  };

  const stop = () => {
    nodesRef.current?.stop();
    nodesRef.current = null;
  };

  useEffect(() => {
    if (on) start();
    else stop();
    localStorage.setItem("tramdiu_ambient", on ? "on" : "off");
  }, [on]);

  return (
    <button
      onClick={() => setOn((v) => !v)}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors",
        on ? "bg-mint-deep text-white" : "bg-white/70 text-foreground/70 hover:bg-white",
        className,
      )}
      aria-label="Bật/tắt nhạc nền dịu"
    >
      {on ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      {on ? "Nhạc nền" : "Nhạc nền"}
    </button>
  );
}
