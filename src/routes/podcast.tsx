import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useMemo, useState } from "react";
import { Play, Pause, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { podcastStore, type Podcast, MOOD_TARGETS } from "@/lib/podcast-store";
import { useTodayMood } from "@/lib/today-mood";
import { CinematicBanner } from "@/components/CinematicBanner";
import { IMAGE_SLOTS } from "@/lib/site-images-store";
import podcastFallback from "@/assets/hp-headphones.jpg";

export const Route = createFileRoute("/podcast")({
  component: () => (
    <RequireAuth>
      <PodcastPage />
    </RequireAuth>
  ),
});

function PodcastPage() {
  const { user } = useAuth();
  const { moodKey, sticker } = useTodayMood();
  const [dbPodcasts, setDbPodcasts] = useState<Podcast[]>([]);
  const [nowPlayingDb, setNowPlayingDb] = useState<Podcast | null>(null);

  useEffect(() => {
    podcastStore.listVisible().then(setDbPodcasts);
  }, []);

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

  return (
    <PageShell>
      <CinematicBanner
        slot={IMAGE_SLOTS.podcastBanner}
        fallbackSrc={podcastFallback}
        kicker="Track 02 — Frequency"
        title="Tần số chữa lành"
        subtitle="Những tấm postcard âm thanh nhỏ mang theo năng lượng bình yên."
        height="md"
      />
      <div className="h-6" />

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
                <div key={p.id} className={`group lift-card rounded-3xl p-4 glass shadow-card border ${matched ? "border-mint/60" : "border-white/60"}`}>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-mint/30 overflow-hidden shrink-0 img-zoom">
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
                            className="cta-glow cta-scrub rounded-full h-7 text-xs bg-mint-deep hover:bg-mint-deep/90 text-white">
                            {isPlaying ? <><Pause className="w-3 h-3 mr-1 icon-wiggle" />Đang phát</> : <><Play className="w-3 h-3 mr-1 icon-wiggle" />Nghe</>}
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
    </PageShell>
  );
}
