import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { MoodSticker } from "@/components/MoodSticker";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { BreathingDialog } from "@/components/BreathingDialog";
import { useAuth } from "@/lib/auth-context";
import { useTodayMood } from "@/lib/today-mood";
import { cloudStore, JournalEntry } from "@/lib/cloud-store";
import { moodCheckinStore, MoodCheckin } from "@/lib/mood-checkin-store";
import { breathingStore, BreathingSession, BADGES, AchievementBadge } from "@/lib/breathing-store";
import { STICKERS, getSticker, StickerOption } from "@/lib/stickers";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, ChevronLeft, ChevronRight, X, Wind, BookHeart, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/mood")({
  component: () => (
    <RequireAuth>
      <MoodPage />
    </RequireAuth>
  ),
});

type RangeKey = "7" | "14" | "30" | "month" | "all";
const RANGES: { key: RangeKey; label: string }[] = [
  { key: "7", label: "7 ngày" },
  { key: "14", label: "14 ngày" },
  { key: "30", label: "30 ngày" },
  { key: "month", label: "Tháng này" },
  { key: "all", label: "Tất cả" },
];

const MOOD_QUESTIONS: Record<string, string[]> = {
  sad: [
    "Điều gì hôm nay khiến lòng mình nặng hơn?",
    "Mình cần điều gì để dịu lại một chút?",
  ],
  joy: [
    "Khoảnh khắc nào hôm nay làm mình mỉm cười?",
    "Mình muốn cảm ơn điều gì?",
  ],
  anger: [
    "Điều gì làm mình thấy bị tổn thương?",
    "Mình có thể nói điều này với bản thân như thế nào cho dịu hơn?",
  ],
  calm: [
    "Điều gì giúp mình giữ được sự yên ổn hôm nay?",
    "Mình muốn nuôi dưỡng cảm giác này thế nào?",
  ],
};

function stickerToGroupKey(stickerType: string): keyof typeof MOOD_QUESTIONS {
  switch (stickerType) {
    case "happy_yellow":
    case "grateful_pink":
      return "joy";
    case "stress_red":
      return "anger";
    case "worry_purple":
    case "empty_gray":
      return "sad";
    default:
      return "calm";
  }
}

function MoodPage() {
  const { user } = useAuth();
  const today = useTodayMood();
  const [checkins, setCheckins] = useState<MoodCheckin[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [sessions, setSessions] = useState<BreathingSession[]>([]);
  const [achievements, setAchievements] = useState<AchievementBadge[]>([]);
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [active, setActive] = useState<{
    date: string;
    checkin?: MoodCheckin;
    entries: JournalEntry[];
    breathingSeconds: number;
    sessions: number;
  } | null>(null);
  const [activeNote, setActiveNote] = useState("");
  const [range, setRange] = useState<RangeKey>("30");
  const [breathingOpen, setBreathingOpen] = useState(false);

  const loadAll = async () => {
    if (!user) return;
    const [c, e, s, a] = await Promise.all([
      moodCheckinStore.listMine(user.id),
      cloudStore.listEntries(user.id),
      breathingStore.list(user.id),
      breathingStore.listAchievements(user.id),
    ]);
    setCheckins(c);
    setEntries(e);
    setSessions(s);
    setAchievements(a);
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [user]);

  // Merge today's central state into the list (instant sync after popup).
  const mergedCheckins = useMemo(() => {
    const map = new Map(checkins.map((c) => [c.entry_date, c]));
    if (today.checkin) map.set(today.checkin.entry_date, today.checkin);
    return Array.from(map.values()).sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  }, [checkins, today.checkin]);

  const checkinByDate = useMemo(() => {
    const m = new Map<string, MoodCheckin>();
    mergedCheckins.forEach((c) => m.set(c.entry_date, c));
    return m;
  }, [mergedCheckins]);

  // Calendar grid
  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date | null; key: string; checkin?: MoodCheckin }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ date: null, key: `pad-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = date.toISOString().slice(0, 10);
      cells.push({ date, key, checkin: checkinByDate.get(key) });
    }
    return cells;
  }, [cursor, checkinByDate]);

  const monthLabel = cursor.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

  const openDay = (key: string) => {
    const c = checkinByDate.get(key);
    const dayEntries = entries.filter((e) => e.created_at.slice(0, 10) === key);
    const daySessions = sessions.filter((s) => s.entry_date === key && s.completed);
    const seconds = daySessions.reduce((a, b) => a + b.duration_seconds, 0);
    setActive({ date: key, checkin: c, entries: dayEntries, breathingSeconds: seconds, sessions: daySessions.length });
    setActiveNote(c?.note_private ?? "");
  };

  const saveNote = async () => {
    if (!active?.checkin) return;
    const r = await moodCheckinStore.updateNote(active.checkin.id, activeNote);
    if (r.error) toast.error(r.error);
    else {
      toast.success("Đã lưu ghi chú riêng");
      setCheckins((arr) => arr.map((c) => c.id === active.checkin!.id ? { ...c, note_private: activeNote } : c));
    }
  };

  // Filter by range
  const filteredCheckins = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (range === "all") return mergedCheckins;
    if (range === "month") {
      const prefix = today.toISOString().slice(0, 7);
      return mergedCheckins.filter((c) => c.entry_date.startsWith(prefix));
    }
    const days = parseInt(range);
    const from = new Date(today); from.setDate(from.getDate() - days + 1);
    const fromKey = from.toISOString().slice(0, 10);
    return mergedCheckins.filter((c) => c.entry_date >= fromKey);
  }, [mergedCheckins, range]);

  // Aggregate by sticker_type
  const stickerCounts = useMemo(() => {
    const m = new Map<string, { count: number; sticker: StickerOption | null }>();
    filteredCheckins.forEach((c) => {
      const s = getSticker(c.sticker_type) ?? {
        type: c.sticker_type, label: c.adjective, color: c.sticker_color, face: "calm" as const,
      };
      const cur = m.get(c.sticker_type) ?? { count: 0, sticker: s };
      m.set(c.sticker_type, { count: cur.count + 1, sticker: s });
    });
    return Array.from(m.entries()).map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [filteredCheckins]);

  const totalChk = filteredCheckins.length || 1;

  // Breathing stats
  const stats = useMemo(() => breathingStore.computeStats(sessions), [sessions]);

  // Breathing daily series (last 30/7 etc.)
  const breathingSeries = useMemo(() => {
    const days = range === "all" ? 30 : range === "month" ? new Date().getDate() : parseInt(range);
    const arr: { date: string; minutes: number }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const sec = stats.byDate[key] ?? 0;
      arr.push({ date: key, minutes: Math.round(sec / 60) });
    }
    return arr;
  }, [stats.byDate, range]);

  // Mascot insight
  const insight = useMemo(() => {
    const sadCount = filteredCheckins.filter((c) => stickerToGroupKey(c.sticker_type) === "sad").length;
    const joyCount = filteredCheckins.filter((c) => stickerToGroupKey(c.sticker_type) === "joy").length;
    const journalDays = new Set(entries.map((e) => e.created_at.slice(0, 10))).size;
    if (stats.currentStreak >= 3) return "Những phút hít thở nhỏ đang giúp cảm xúc của bạn mềm lại từng chút một.";
    if (sadCount >= 3 && sadCount > joyCount) return "Mình thấy gần đây bạn có nhiều ngày hơi nặng lòng. Mình ở đây với bạn, thử hít thở một phút thật chậm nhé.";
    if (joyCount >= 3 && joyCount > sadCount) return "Dạo này bạn có nhiều ngày sáng hơn rồi đó. Nhớ ghi lại điều nhỏ xinh đã khiến bạn vui nhé.";
    if (journalDays >= 3) return "Bạn thường nhẹ nhõm hơn vào những ngày có viết nhật ký. Cứ giữ thói quen này nhé — mình ở đây với bạn.";
    return "Mỗi ngày bạn ghé qua trạm là một bước nhỏ về phía dịu dàng. Mình ở đây với bạn.";
  }, [filteredCheckins, entries, stats.currentStreak]);

  // Mini 7-day breathing track
  const last7 = useMemo(() => {
    const arr: { date: string; sec: number }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push({ date: key, sec: stats.byDate[key] ?? 0 });
    }
    return arr;
  }, [stats.byDate]);

  const breathingDayMaxMin = Math.max(1, ...breathingSeries.map((d) => d.minutes));
  const bestBreathingDay = useMemo(() => {
    const entries = Object.entries(stats.byDate).sort((a, b) => b[1] - a[1])[0];
    return entries ? { date: entries[0], minutes: Math.round(entries[1] / 60) } : null;
  }, [stats.byDate]);

  const empty = mergedCheckins.length === 0 && sessions.length === 0;

  return (
    <PageShell>
      <header className="mb-6 animate-[fade-up_0.6s_ease-out]">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Hospital Playlist</p>
        <h1 className="text-3xl font-semibold mt-1">Hành trình của bạn</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mỗi sticker là một ngày bạn dám gọi tên cảm xúc của mình.
        </p>
      </header>

      {empty && (
        <section className="rounded-3xl p-6 glass shadow-card animate-[fade-up_0.6s_ease-out] text-center mb-6 border border-white/60">
          <div className="flex justify-center"><Mascot size="md" variant="question" floating /></div>
          <p className="mt-3 text-sm text-foreground/80">
            Chưa có nhiều dữ liệu đâu, mình sẽ đi cùng bạn từng ngày một.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to="/"><Button className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">Check-in cảm xúc hôm nay</Button></Link>
            <Button variant="outline" className="rounded-full" onClick={() => setBreathingOpen(true)}>
              <Wind className="w-4 h-4 mr-1.5" /> Hít thở 1 phút
            </Button>
          </div>
        </section>
      )}

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
            const isToday = c.date.toDateString() === new Date().toDateString();
            const sticker = c.checkin
              ? (getSticker(c.checkin.sticker_type) ?? {
                  type: c.checkin.sticker_type,
                  label: c.checkin.adjective,
                  color: c.checkin.sticker_color,
                  face: "calm" as const,
                })
              : null;
            return (
              <button
                key={c.key}
                onClick={() => openDay(c.key)}
                className="aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] font-medium border border-white/60 hover:scale-110 transition-transform relative"
                style={{
                  background: sticker
                    ? `color-mix(in oklch, ${sticker.color} 55%, white)`
                    : "color-mix(in oklch, var(--muted) 60%, white)",
                  outline: isToday ? "2px solid var(--mint-deep)" : undefined,
                }}
                title={c.checkin?.adjective}
              >
                {sticker ? (
                  <>
                    <MoodSticker sticker={sticker} size={Math.max(20, 26)} />
                    <span className="text-[9px] mt-0.5 text-foreground/70">{c.date.getDate()}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">{c.date.getDate()}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend = same sticker palette as the popup */}
        <div className="flex flex-wrap gap-x-3 gap-y-2 mt-4 text-xs">
          {STICKERS.map((s) => (
            <div key={s.type} className="flex items-center gap-1.5">
              <MoodSticker sticker={s} size={18} />
              <span className="text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="mt-6 rounded-3xl p-5 glass shadow-card animate-[fade-up_0.6s_ease-out]">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="font-semibold">Biểu đồ cảm xúc của bạn</h2>
          <div className="flex flex-wrap gap-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  range === r.key
                    ? "bg-mint-deep text-white border-mint-deep"
                    : "bg-white/70 border-white/80 text-foreground/70 hover:bg-mint/20"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {stickerCounts.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Chưa có check-in nào trong khoảng này.</p>
        ) : (
          <div className="space-y-3">
            {stickerCounts.map((row) => {
              const pct = Math.round((row.count / totalChk) * 100);
              return (
                <div key={row.type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium flex items-center gap-1.5">
                      {row.sticker && <MoodSticker sticker={row.sticker} size={18} />}
                      {row.sticker?.label ?? row.type}
                    </span>
                    <span className="text-muted-foreground">{row.count} ngày · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: row.sticker?.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trend timeline */}
        <div className="mt-6">
          <p className="text-xs text-muted-foreground mb-2">Xu hướng theo ngày</p>
          <div className="flex items-end gap-1 overflow-x-auto pb-1">
            {filteredCheckins.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">—</p>
            ) : (
              filteredCheckins.map((c) => {
                const s = getSticker(c.sticker_type) ?? {
                  type: c.sticker_type, label: c.adjective, color: c.sticker_color, face: "calm" as const,
                };
                return (
                  <button
                    key={c.id}
                    onClick={() => openDay(c.entry_date)}
                    className="flex flex-col items-center gap-1 min-w-[34px] hover:scale-110 transition-transform"
                    title={`${c.entry_date} · ${c.adjective}`}
                  >
                    <MoodSticker sticker={s} size={26} />
                    <span className="text-[9px] text-muted-foreground">
                      {c.entry_date.slice(8, 10)}/{c.entry_date.slice(5, 7)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Insight */}
      <section className="mt-6 rounded-3xl p-5 shadow-card animate-[fade-up_0.6s_ease-out] border border-mint/40"
        style={{ background: "color-mix(in oklch, var(--mint) 25%, white)" }}>
        <div className="flex items-center gap-2 text-xs text-mint-deep mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Insight từ Mascot
        </div>
        <p className="text-foreground/90 leading-relaxed text-sm">{insight}</p>
      </section>

      {/* Meditation streak */}
      <section className="mt-6 rounded-3xl p-5 glass shadow-card animate-[fade-up_0.6s_ease-out]">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h2 className="font-semibold">Chuỗi thiền của bạn</h2>
          <Button size="sm" className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white" onClick={() => setBreathingOpen(true)}>
            <Wind className="w-4 h-4 mr-1.5" /> Hít thở ngay
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-2xl p-3 bg-white/60 border border-white/70">
            <p className="text-[11px] uppercase text-muted-foreground">Chuỗi hiện tại</p>
            <p className="font-semibold text-base">🔥 {stats.currentStreak} ngày</p>
          </div>
          <div className="rounded-2xl p-3 bg-white/60 border border-white/70">
            <p className="text-[11px] uppercase text-muted-foreground">Tháng này</p>
            <p className="font-semibold text-base">🌿 {Math.round(stats.totalSecondsThisMonth / 60)} phút</p>
          </div>
          <div className="rounded-2xl p-3 bg-white/60 border border-white/70">
            <p className="text-[11px] uppercase text-muted-foreground">Số phiên</p>
            <p className="font-semibold text-base">{stats.totalSessions}</p>
          </div>
          <div className="rounded-2xl p-3 bg-white/60 border border-white/70">
            <p className="text-[11px] uppercase text-muted-foreground">Kỷ lục dịu nhất</p>
            <p className="font-semibold text-base">✨ {stats.longestStreak} ngày</p>
          </div>
        </div>

        {/* Mini 7-day track */}
        <div className="mt-4">
          <p className="text-[11px] text-muted-foreground mb-2">7 ngày gần đây</p>
          <div className="flex gap-1.5">
            {last7.map((d) => {
              const done = d.sec > 0;
              return (
                <div
                  key={d.date}
                  title={`${d.date} · ${Math.round(d.sec / 60)} phút`}
                  className="flex-1 aspect-square rounded-xl border border-white/70 flex items-center justify-center text-[10px]"
                  style={{
                    background: done
                      ? `color-mix(in oklch, var(--mint) 65%, white)`
                      : `color-mix(in oklch, var(--muted) 55%, white)`,
                    color: done ? "var(--mint-deep)" : "var(--muted-foreground)",
                  }}
                >
                  {d.date.slice(8, 10)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievement badges */}
        <div className="mt-5">
          <p className="text-[11px] text-muted-foreground mb-2">Huy hiệu thành tựu</p>
          <div className="flex flex-wrap gap-2">
            {BADGES.map((b) => {
              const unlocked = achievements.some((a) => a.badge_type === b.type);
              return (
                <div
                  key={b.type}
                  title={b.desc}
                  className={`text-xs px-3 py-1.5 rounded-full border ${
                    unlocked
                      ? "bg-mint/40 border-mint-deep/40 text-mint-deep"
                      : "bg-muted/40 border-white/70 text-muted-foreground opacity-60"
                  }`}
                >
                  {b.emoji} {b.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-10" />

      {/* Day detail modal */}
      {active && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-up_0.3s_ease-out]" onClick={() => setActive(null)}>
          <div className="glass-strong rounded-3xl shadow-soft max-w-md w-full p-6 relative border border-white/60 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActive(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {new Date(active.date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>

            {active.checkin ? (
              <>
                <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/60 border border-white/70">
                  {(() => {
                    const s = getSticker(active.checkin.sticker_type) ?? {
                      type: active.checkin.sticker_type, label: active.checkin.adjective,
                      color: active.checkin.sticker_color, face: "calm" as const,
                    };
                    return <MoodSticker sticker={s} size={44} />;
                  })()}
                  <div>
                    <p className="font-medium capitalize">{active.checkin.adjective}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {getSticker(active.checkin.sticker_type)?.label ?? "Cảm xúc"}
                    </p>
                  </div>
                </div>

                {/* Private note */}
                <div className="mt-4">
                  <label className="text-xs text-muted-foreground">
                    {MOOD_QUESTIONS[stickerToGroupKey(active.checkin.sticker_type)][0]}
                  </label>
                  <textarea
                    value={activeNote}
                    onChange={(e) => setActiveNote(e.target.value)}
                    placeholder="Một ghi chú riêng tư cho bạn..."
                    className="mt-1 w-full text-sm rounded-2xl px-3 py-2 bg-white/70 border border-white/80 focus:outline-none focus:ring-2 focus:ring-mint-deep/40 min-h-[80px]"
                  />
                  <Button size="sm" onClick={saveNote} className="mt-2 rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
                    <Save className="w-3.5 h-3.5 mr-1.5" /> Lưu ghi chú
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground italic">Chưa ghi nhận cảm xúc cho ngày này.</p>
            )}

            {active.breathingSeconds > 0 && (
              <div className="mt-4 rounded-2xl px-3 py-2 bg-mint/30 border border-mint-deep/20 text-sm text-mint-deep">
                🌿 Đã thở cùng mascot {Math.round(active.breathingSeconds / 60)} phút · {active.sessions} phiên
              </div>
            )}

            {active.entries.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Nhật ký ngày này</p>
                  <Link to="/journal"><Button size="sm" variant="ghost" className="rounded-full text-mint-deep">
                    <BookHeart className="w-3.5 h-3.5 mr-1" /> Xem nhật ký
                  </Button></Link>
                </div>
                <div className="mt-2 space-y-2 max-h-[30vh] overflow-y-auto">
                  {active.entries.map((e) => (
                    <div key={e.id} className="rounded-2xl p-3 bg-white/60 border border-white/70">
                      <p className="font-semibold text-sm">{e.title || "Không tiêu đề"}</p>
                      <div className="text-xs text-foreground/70 mt-1 line-clamp-3 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: e.body || "" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BreathingDialog open={breathingOpen} onClose={() => { setBreathingOpen(false); loadAll(); }} />
    </PageShell>
  );
}
