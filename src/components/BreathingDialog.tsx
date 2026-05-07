import { useEffect, useRef, useState } from "react";
import { X, Pause, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/Mascot";
import { useAuth } from "@/lib/auth-context";
import { breathingStore, BADGES } from "@/lib/breathing-store";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

interface Props {
  open: boolean;
  onClose: () => void;
}

const DURATIONS = [1, 3, 5, 10]; // minutes
// 4-4-6 cycle (sec)
const PHASES: { label: string; sec: number; scale: number }[] = [
  { label: "Hít vào…", sec: 4, scale: 1 },
  { label: "Giữ nhẹ…", sec: 4, scale: 1 },
  { label: "Thở ra…", sec: 6, scale: 0.55 },
];

export function BreathingDialog({ open, onClose }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<"choose" | "running" | "done">("choose");
  const [minutes, setMinutes] = useState(1);
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(60);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseRemaining, setPhaseRemaining] = useState(PHASES[0].sec);
  const [unlockedNow, setUnlockedNow] = useState<string[]>([]);
  const [streak, setStreak] = useState<number | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setStep("choose");
      setPaused(false);
      setUnlockedNow([]);
      setStreak(null);
      completedRef.current = false;
    }
  }, [open]);

  // Tick
  useEffect(() => {
    if (step !== "running" || paused) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        const nr = r - 1;
        if (nr <= 0) {
          completedRef.current = true;
          finish(true);
          return 0;
        }
        return nr;
      });
      setPhaseRemaining((p) => {
        if (p <= 1) {
          setPhaseIdx((i) => (i + 1) % PHASES.length);
          return PHASES[(phaseIdx + 1) % PHASES.length].sec;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step, paused, phaseIdx]);

  const start = (m: number) => {
    setMinutes(m);
    setRemaining(m * 60);
    setPhaseIdx(0);
    setPhaseRemaining(PHASES[0].sec);
    setStep("running");
    setPaused(false);
  };

  const finish = async (completed: boolean) => {
    if (!user) {
      setStep("done");
      return;
    }
    const planned = minutes * 60;
    const duration = completed ? planned : planned - remaining;
    await breathingStore.logSession({
      user_id: user.id,
      duration_seconds: duration,
      planned_seconds: planned,
      completed,
    });
    if (completed) {
      const sessions = await breathingStore.list(user.id);
      const stats = breathingStore.computeStats(sessions);
      setStreak(stats.currentStreak);
      const already = (await breathingStore.listAchievements(user.id)).map((a) => a.badge_type);
      const newly = await breathingStore.evaluateAndUnlock(user.id, stats, already);
      setUnlockedNow(newly);
      newly.forEach((t) => {
        const b = BADGES.find((x) => x.type === t);
        if (b) toast.success(`${b.emoji} ${b.label}`, { description: b.desc });
      });
    }
    setStep("done");
  };

  if (!open) return null;

  const phase = PHASES[phaseIdx];
  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-up_0.3s_ease-out]">
      <div className="glass-strong rounded-3xl shadow-soft max-w-md w-full p-6 md:p-8 relative border border-white/60">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        {step === "choose" && (
          <div className="flex flex-col items-center text-center">
            <Mascot size="md" variant="default" floating />
            <h2 className="mt-4 text-xl md:text-2xl font-display font-medium">
              Cùng mình thở chậm lại một chút nhé
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Chọn thời gian bạn muốn dành cho hơi thở hôm nay.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {DURATIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => start(m)}
                  className="rounded-full px-5 py-2.5 text-sm bg-white/70 border border-white/80 hover:bg-mint/40 hover:border-mint-deep/40 hover:text-mint-deep transition-colors"
                >
                  {m} phút
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "running" && (
          <div className="flex flex-col items-center text-center py-2">
            <div className="relative w-56 h-56 flex items-center justify-center">
              <div
                className="absolute rounded-full bg-mint/40"
                style={{
                  width: "100%",
                  height: "100%",
                  transform: `scale(${phase.scale})`,
                  transition: `transform ${phase.sec}s ease-in-out`,
                }}
              />
              <div
                className="absolute rounded-full bg-mint/60"
                style={{
                  width: "75%",
                  height: "75%",
                  transform: `scale(${phase.scale})`,
                  transition: `transform ${phase.sec}s ease-in-out`,
                }}
              />
              <div className="relative z-10 text-center">
                <p className="font-display text-lg text-mint-deep">{phase.label}</p>
                <p className="text-3xl font-medium mt-1">{mm}:{ss}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? <Play className="w-4 h-4 mr-1.5" /> : <Pause className="w-4 h-4 mr-1.5" />}
                {paused ? "Tiếp tục" : "Tạm dừng"}
              </Button>
              <Button
                className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white"
                onClick={() => finish(false)}
              >
                Kết thúc
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center text-center">
            <Mascot size="md" variant="happy" floating />
            <div className="mt-3 inline-flex items-center gap-1.5 text-mint-deep text-xs">
              <CheckCircle2 className="w-4 h-4" /> Đã ghi nhận
            </div>
            <h2 className="mt-2 text-xl md:text-2xl font-display font-medium">
              {completedRef.current
                ? "Bạn đã giữ lời hẹn với chính mình hôm nay 🌿"
                : "Một khởi đầu nhỏ cũng đã rất đáng quý 🌱"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {completedRef.current
                ? `Chỉ ${minutes} phút thôi, nhưng bạn đã quay về với hơi thở của mình.`
                : "Khi nào sẵn sàng, mình lại thở cùng bạn nhé."}
            </p>
            {streak !== null && streak > 0 && (
              <p className="mt-3 text-sm text-mint-deep">
                Chuỗi thiền của bạn: <strong>{streak} ngày liên tiếp</strong>
              </p>
            )}
            {unlockedNow.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {unlockedNow.map((t) => {
                  const b = BADGES.find((x) => x.type === t);
                  if (!b) return null;
                  return (
                    <span key={t} className="rounded-full bg-mint/40 text-mint-deep text-xs px-3 py-1">
                      {b.emoji} {b.label}
                    </span>
                  );
                })}
              </div>
            )}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link to="/mood" onClick={onClose}>
                <Button variant="outline" className="rounded-full">Xem hành trình cảm xúc</Button>
              </Link>
              <Button className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white" onClick={onClose}>
                Tiếp tục khám phá
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
