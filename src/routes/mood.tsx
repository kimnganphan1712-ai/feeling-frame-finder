import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { MOODS, MoodKey } from "@/lib/mood";
import { useAuth } from "@/lib/auth-context";
import { useTodayMood } from "@/lib/today-mood";
import { cloudStore, JournalEntry } from "@/lib/cloud-store";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, TrendingUp, ChevronLeft, ChevronRight, X } from "lucide-react";

export const Route = createFileRoute("/mood")({
  component: () => (
    <RequireAuth>
      <MoodPage />
    </RequireAuth>
  ),
});

function MoodPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<{ date: string; mood: MoodKey }[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [active, setActive] = useState<{ date: string; mood?: MoodKey; entries: JournalEntry[] } | null>(null);

  useEffect(() => {
    if (!user) return;
    cloudStore.getMoodHistory(user.id).then(setHistory);
    cloudStore.listEntries(user.id).then(setEntries);
  }, [user]);

  const counts: Record<MoodKey, number> = { joy: 0, calm: 0, anger: 0, sad: 0 };
  history.forEach((h) => counts[h.mood]++);
  const total = history.length || 1;

  // Build month grid
  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay(); // Sun=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date | null; key: string; mood?: MoodKey }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ date: null, key: `pad-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = date.toISOString().slice(0, 10);
      const m = history.find((h) => h.date === key)?.mood;
      cells.push({ date, key, mood: m });
    }
    return cells;
  }, [cursor, history]);

  const monthLabel = cursor.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

  const openDay = (key: string, mood?: MoodKey) => {
    const dayEntries = entries.filter((e) => e.created_at.slice(0, 10) === key);
    setActive({ date: key, mood, entries: dayEntries });
  };

  return (
    <PageShell>
      <header className="mb-6 animate-[fade-up_0.6s_ease-out]">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Cảm xúc</p>
        <h1 className="text-3xl font-semibold mt-1">Hành trình của bạn</h1>
        <p className="text-muted-foreground text-sm mt-1">Mỗi sticker là một ngày bạn dám gọi tên cảm xúc của mình.</p>
      </header>

      {/* Calendar month view */}
      <section className="rounded-3xl p-5 glass shadow-card animate-[fade-up_0.6s_ease-out]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="w-8 h-8 rounded-full hover:bg-mint/30 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-semibold capitalize">{monthLabel}</h2>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="w-8 h-8 rounded-full hover:bg-mint/30 flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
            <div key={d} className="text-center py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((c) => {
            if (!c.date) return <div key={c.key} />;
            const m = c.mood ? MOODS.find((x) => x.key === c.mood) : null;
            const isToday = c.date.toDateString() === new Date().toDateString();
            return (
              <button
                key={c.key}
                onClick={() => openDay(c.key, c.mood)}
                className="aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] font-medium border border-white/60 hover:scale-110 transition-transform relative"
                style={{
                  background: m
                    ? `color-mix(in oklch, ${m.colorVar} 55%, white)`
                    : "color-mix(in oklch, var(--muted) 60%, white)",
                  color: m ? "white" : "var(--muted-foreground)",
                  outline: isToday ? "2px solid var(--mint-deep)" : undefined,
                }}
                title={m?.label}
              >
                {m ? <span className="text-base leading-none">{m.emoji}</span> : <span>{c.date.getDate()}</span>}
                {m && <span className="text-[9px] mt-0.5 opacity-90">{c.date.getDate()}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-xs">
          {MOODS.map((m) => (
            <div key={m.key} className="flex items-center gap-1.5">
              <span>{m.emoji}</span>
              <span className="text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Distribution */}
      <section className="mt-6 rounded-3xl p-5 glass shadow-card animate-[fade-up_0.6s_ease-out]">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-mint-deep" /> Tỉ lệ cảm xúc ({history.length} ngày)
        </h2>
        <div className="space-y-3">
          {MOODS.map((m) => {
            const pct = Math.round((counts[m.key] / total) * 100);
            return (
              <div key={m.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{m.emoji} {m.label}</span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: m.colorVar }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-3xl p-5 shadow-card animate-[fade-up_0.6s_ease-out] border border-mint/40"
        style={{ background: "color-mix(in oklch, var(--mint) 25%, white)" }}>
        <div className="flex items-center gap-2 text-xs text-mint-deep mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Insight từ Mascot
        </div>
        <p className="text-foreground/90 leading-relaxed text-sm">
          Bạn thường nhẹ nhàng hơn vào những ngày có viết nhật ký. Cứ giữ thói quen này nhé — mình ở đây với bạn.
        </p>
      </section>

      {/* Day detail modal */}
      {active && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-up_0.3s_ease-out]" onClick={() => setActive(null)}>
          <div className="glass-strong rounded-3xl shadow-soft max-w-md w-full p-6 relative border border-white/60" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActive(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {new Date(active.date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            {active.mood ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-3xl">{MOODS.find(m => m.key === active.mood)?.emoji}</span>
                <span className="font-semibold">{MOODS.find(m => m.key === active.mood)?.label}</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground italic">Chưa ghi nhận cảm xúc cho ngày này.</p>
            )}

            {active.entries.length > 0 ? (
              <div className="mt-4 space-y-3 max-h-[40vh] overflow-y-auto">
                {active.entries.map((e) => (
                  <div key={e.id} className="rounded-2xl p-3 bg-white/60 border border-white/70">
                    <p className="font-semibold text-sm">{e.title || "Không tiêu đề"}</p>
                    <div className="text-xs text-foreground/70 mt-1 line-clamp-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: e.body || "" }} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Không có bài viết nào trong ngày.</p>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
