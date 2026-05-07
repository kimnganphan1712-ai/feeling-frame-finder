import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useMemo, useState } from "react";
import { Play, Pause, Check, Lock, Heart, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cloudStore } from "@/lib/cloud-store";
import { podcastStore, type Podcast, MOOD_TARGETS } from "@/lib/podcast-store";
import { useTodayMood } from "@/lib/today-mood";

export const Route = createFileRoute("/podcast")({
  component: () => (
    <RequireAuth>
      <PodcastPage />
    </RequireAuth>
  ),
});

const EPISODES = [
  { n: 1, title: "Bắt đầu — Vì sao mình cần một trạm dừng?", duration: "12:30", done: true },
  { n: 2, title: "Lắng nghe cơ thể trước khi lắng nghe đầu", duration: "15:10", done: true },
  { n: 3, title: "Gọi tên cảm xúc — bài học khó nhất", duration: "14:00", done: false },
  { n: 4, title: "Khi mình giận — đừng vội xin lỗi", duration: "16:25", done: false },
  { n: 5, title: "Cô đơn không có nghĩa là bị bỏ rơi", duration: "18:40", done: false },
  { n: 6, title: "Tha thứ cho phiên bản cũ của mình", duration: "13:15", done: false },
  { n: 7, title: "Ranh giới — yêu thương cần có hàng rào", duration: "17:00", done: false },
  { n: 8, title: "Khi mọi người không hiểu mình", duration: "15:50", done: false },
  { n: 9, title: "Chữa lành không phải là quên", duration: "16:20", done: false },
  { n: 10, title: "Sống dịu dàng với chính mình", duration: "20:00", done: false },
];

const EXTRA = [
  { title: "Người trẻ và áp lực \"phải ổn\"", tag: "Mở rộng" },
  { title: "Cảm xúc nơi công sở", tag: "Mở rộng" },
];

function PodcastPage() {
  const { user } = useAuth();
  const { moodKey, sticker } = useTodayMood();
  const [playing, setPlaying] = useState<number | null>(3);
  const [progress, setProgress] = useState<Record<number, { completed: boolean; favorited: boolean }>>({});
  const [dbPodcasts, setDbPodcasts] = useState<Podcast[]>([]);
  const [nowPlayingDb, setNowPlayingDb] = useState<Podcast | null>(null);

  useEffect(() => {
    podcastStore.listVisible().then(setDbPodcasts);
  }, []);

  useEffect(() => {
    if (!user) return;
    cloudStore.getPodcastProgress(user.id).then((rows) => {
      const map: typeof progress = {};
      rows.forEach((r) => { map[r.episode_id] = { completed: r.completed, favorited: r.favorited }; });
      setProgress(map);
    });
  }, [user]);

  // Sort/filter podcasts by today's mood — matching mood_targets get priority
  const sortedPodcasts = useMemo(() => {
    if (!moodKey) return dbPodcasts;
    return [...dbPodcasts].sort((a, b) => {
      const aMatch = a.mood_targets.includes(moodKey) ? 1 : 0;
      const bMatch = b.mood_targets.includes(moodKey) ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [dbPodcasts, moodKey]);

  const moodLabel = moodKey ? MOOD_TARGETS.find((m) => m.value === moodKey)?.label : null;

  const toggleDone = async (n: number) => {
    if (!user) return;
    const cur = progress[n]?.completed ?? false;
    setProgress((p) => ({ ...p, [n]: { ...p[n], completed: !cur, favorited: p[n]?.favorited ?? false } }));
    await cloudStore.setEpisodeStatus(user.id, n, { completed: !cur });
  };

  const toggleFav = async (n: number) => {
    if (!user) return;
    const cur = progress[n]?.favorited ?? false;
    setProgress((p) => ({ ...p, [n]: { ...p[n], favorited: !cur, completed: p[n]?.completed ?? false } }));
    await cloudStore.setEpisodeStatus(user.id, n, { favorited: !cur });
  };

  const isDone = (n: number) => progress[n]?.completed ?? EPISODES[n - 1].done;
  const done = EPISODES.filter((e) => isDone(e.n)).length;
  const pct = Math.round((done / EPISODES.length) * 100);

  return (
    <PageShell>
      <header className="mb-6 animate-[fade-up_0.6s_ease-out]">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Podcast</p>
        <h1 className="text-3xl font-semibold mt-1">10 bài học nền tảng</h1>
        <p className="text-muted-foreground text-sm mt-1">Mascot ngồi nghe cùng bạn 🎧</p>
      </header>

      {/* Healing podcasts from admin (DB) */}
      <section className="mb-8 animate-[fade-up_0.6s_ease-out]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Headphones className="w-3.5 h-3.5" /> Podcast chữa lành
          </h2>
          {moodLabel && (
            <span className="text-xs text-mint-deep">
              Gợi ý theo cảm xúc: {sticker?.label ?? moodLabel}
            </span>
          )}
        </div>
        {sortedPodcasts.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Chưa có podcast nào được đăng tải.</p>
        ) : (
          <div className="space-y-3">
            {sortedPodcasts.map((p) => {
              const matched = moodKey && p.mood_targets.includes(moodKey);
              const isPlaying = nowPlayingDb?.id === p.id;
              return (
                <div key={p.id} className={`rounded-3xl p-4 glass shadow-card border ${matched ? "border-mint/60" : "border-white/60"}`}>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-mint/30 overflow-hidden shrink-0">
                      {p.cover_image_url && <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="font-semibold text-sm flex-1 truncate">{p.title}</h3>
                        {matched && <span className="text-[10px] px-2 py-0.5 rounded-full bg-mint/40 text-mint-deep shrink-0">Phù hợp</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_description}</p>
                      {p.host && <p className="text-[10px] text-muted-foreground mt-1">🎙 {p.host}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        {p.audio_url && (
                          <Button size="sm" onClick={() => setNowPlayingDb(isPlaying ? null : p)}
                            className="rounded-full h-7 text-xs bg-mint-deep hover:bg-mint-deep/90 text-white">
                            {isPlaying ? <><Pause className="w-3 h-3 mr-1" />Đang phát</> : <><Play className="w-3 h-3 mr-1" />Nghe</>}
                          </Button>
                        )}
                        {p.mood_targets.slice(0, 3).map((m) => (
                          <span key={m} className="text-[10px] text-muted-foreground">
                            #{MOOD_TARGETS.find((x) => x.value === m)?.label ?? m}
                          </span>
                        ))}
                      </div>
                      {isPlaying && p.audio_url && (
                        <audio src={p.audio_url} controls autoPlay className="w-full mt-3" />
                      )}
                      {p.healing_message && (
                        <p className="mt-3 text-xs italic text-mint-deep border-l-2 border-mint pl-2">💌 {p.healing_message}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Progress */}
      <section className="rounded-3xl p-5 glass shadow-card animate-[fade-up_0.6s_ease-out]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Tiến độ khoá học</span>
          <span className="text-sm font-semibold text-mint-deep">{done}/{EPISODES.length}</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-to-r from-mint-deep to-blush-deep transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </section>

      {/* Now playing */}
      {playing && (
        <section className="mt-6 rounded-3xl p-5 shadow-card border border-mint/40 animate-[fade-up_0.6s_ease-out]"
          style={{ background: "color-mix(in oklch, var(--mint) 30%, white)" }}>
          <p className="text-xs text-mint-deep font-medium mb-1">Đang phát</p>
          <p className="font-semibold">Tập #{playing} — {EPISODES[playing - 1].title}</p>
          <div className="flex items-center gap-3 mt-4">
            <Button onClick={() => setPlaying(null)} size="icon" className="rounded-full w-12 h-12 bg-mint-deep hover:bg-mint-deep/90">
              <Pause className="w-5 h-5" />
            </Button>
            <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
              <div className="h-full bg-mint-deep rounded-full" style={{ width: "38%" }} />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">5:21 / 14:00</span>
          </div>
        </section>
      )}

      {/* Episodes */}
      <section className="mt-6 space-y-2">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">10 tập chính</h2>
        {EPISODES.map((ep) => {
          const epDone = isDone(ep.n);
          const epFav = progress[ep.n]?.favorited ?? false;
          return (
            <div
              key={ep.n}
              className="w-full text-left rounded-2xl p-4 glass shadow-card flex items-center gap-3 border border-white/60"
            >
              <button
                onClick={() => toggleDone(ep.n)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  epDone ? "bg-mint/40 text-mint-deep" : playing === ep.n ? "bg-blush/50 text-blush-deep" : "bg-muted text-muted-foreground hover:bg-mint/30"
                }`}
                aria-label={epDone ? "Đã xong" : "Đánh dấu xong"}
              >
                {epDone ? <Check className="w-5 h-5" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button onClick={() => setPlaying(ep.n)} className="flex-1 min-w-0 text-left">
                <p className="text-xs text-muted-foreground">Tập #{ep.n}</p>
                <p className="font-semibold text-sm truncate">{ep.title}</p>
              </button>
              <button
                onClick={() => toggleFav(ep.n)}
                className={`p-2 rounded-full transition-colors ${epFav ? "text-blush-deep" : "text-muted-foreground hover:text-blush-deep"}`}
                aria-label="Yêu thích"
              >
                <Heart className="w-4 h-4" fill={epFav ? "currentColor" : "none"} />
              </button>
              <span className="text-xs text-muted-foreground tabular-nums">{ep.duration}</span>
            </div>
          );
        })}
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
          <Lock className="w-3 h-3" /> Tập mở rộng (sắp ra mắt)
        </h2>
        {EXTRA.map((e, i) => (
          <div key={i} className="rounded-2xl p-4 bg-muted/40 border border-dashed border-border flex items-center gap-3 opacity-70">
            <div className="w-10 h-10 rounded-2xl bg-white/60 flex items-center justify-center text-muted-foreground">
              <Lock className="w-4 h-4" />
            </div>
            <p className="font-medium text-sm">{e.title}</p>
            <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{e.tag}</span>
          </div>
        ))}
      </section>
    </PageShell>
  );
}
