import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Splash } from "@/components/Splash";
import { MoodCheckIn } from "@/components/MoodCheckIn";
import { PageShell } from "@/components/PageShell";
import { Mascot } from "@/components/Mascot";
import { RequireAuth } from "@/components/RequireAuth";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/lib/auth-context";
import { cloudStore } from "@/lib/cloud-store";
import { MOODS } from "@/lib/mood";
import { useTodayMood } from "@/lib/today-mood";
import { MoodSticker } from "@/components/MoodSticker";
import { BreathingDialog } from "@/components/BreathingDialog";
import { EmotionCornerDialog, EMOTION_CORNERS, type EmotionCorner } from "@/components/EmotionCornerDialog";
import { Button } from "@/components/ui/button";
import { siteSettingsStore, SITE_KEYS } from "@/lib/site-settings-store";
import heroDefault from "@/assets/hero-hospital-playlist.jpg";
import {
  Headphones,
  BookHeart,
  Sparkles,
  Wind,
  Quote as QuoteIcon,
  Lock,
  ChevronRight,
  Heart,
  Globe2,
  Stethoscope,
  Pill,
  Music2,
  PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: () => (
    <RequireAuth>
      <HomePage />
    </RequireAuth>
  ),
});

const TRACKS = [
  { n: "01", to: "/about", title: "Phác đồ chữa lành", desc: "Hành trình bắt đầu — hiểu chính dự án này.", icon: Stethoscope, tone: "scrub" },
  { n: "02", to: "/prescription", title: "Đơn thuốc tinh thần", desc: "Một toa thuốc dịu dàng được kê riêng cho hôm nay.", icon: Pill, tone: "warm" },
  { n: "03", to: "/podcast", title: "Tần số chữa lành", desc: "Cassette mở lên — sóng âm xoa dịu tâm trí.", icon: Headphones, tone: "scrub" },
  { n: "04", to: "/vitamin", title: "Vitamin cho tâm hồn", desc: "Kho quote, sách, bộ phim chữa lành.", icon: Sparkles, tone: "warm" },
  { n: "05", to: "/mood-board", title: "Trạm kết nối", desc: "Bản đồ cảm xúc cộng đồng — bạn không một mình.", icon: Globe2, tone: "scrub" },
  { n: "06", to: "/journal", title: "Hồ sơ cảm xúc", desc: "Căn phòng riêng có khóa — chỉ dành cho bạn.", icon: BookHeart, tone: "warm" },
] as const;


const DAILY_QUOTES = [
  {
    text: "Hôm nay bạn không cần phải mạnh mẽ. Bạn chỉ cần thật lòng với cảm xúc của mình.",
    source: "Hospital Playlist",
  },
  {
    text: "Có những ngày rất chậm, nhưng không có nghĩa là bạn đang đứng yên.",
    source: "Lời nhắc dịu",
  },
  {
    text: "Bạn xứng đáng được dịu dàng, kể cả khi bạn chưa hoàn hảo.",
    source: "Hospital Playlist",
  },
  {
    text: "Bạn không cần phải vội vàng chữa lành. Cây cối còn cần cả mùa đông để đâm chồi lại.",
    source: "Hospital Playlist",
  },
];

const HEALING_SUGGESTIONS = [
  {
    tag: "Podcast",
    title: "Một ngày nhẹ hơn",
    desc: "Một tập podcast ngắn giúp bạn thả lỏng sau một ngày nhiều suy nghĩ.",
    to: "/podcast" as const,
    tint: "var(--mint)",
  },
  {
    tag: "Đơn thuốc",
    title: "Đơn thuốc tinh thần hôm nay",
    desc: "Một toa thuốc dịu dàng được kê riêng cho trái tim bạn hôm nay.",
    to: "/prescription" as const,
    tint: "var(--blush)",
  },
  {
    tag: "Breathing",
    title: "3 phút quay về",
    desc: "Một bài thở ngắn giúp bạn bình tĩnh lại khi tâm trí quá ồn.",
    to: "/mood" as const,
    tint: "var(--mint)",
  },
  {
    tag: "Playlist",
    title: "Khi bạn thấy cô đơn",
    desc: "Một bộ nội dung dịu dàng dành cho những ngày bạn thấy mình lạc lõng.",
    to: "/vitamin" as const,
    tint: "var(--blush)",
  },
];


function HomePage() {
  const { user, displayName } = useAuth();
  const today = useTodayMood();
  const [phase, setPhase] = useState<"splash" | "mood" | "ready">("splash");
  const [streak, setStreak] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [activeCorner, setActiveCorner] = useState<EmotionCorner | null>(null);
  const [heroImage, setHeroImage] = useState<string>(heroDefault);

  useEffect(() => {
    siteSettingsStore.get(SITE_KEYS.heroImage).then((url) => {
      if (url) setHeroImage(url);
    });
  }, []);

  // Decide whether to skip the pop-up: if today's check-in already exists, go straight to "ready".
  useEffect(() => {
    if (!user || today.loading) return;
    cloudStore.getMoodHistory(user.id).then((h) => setStreak(h.length));
    if (today.checkin && phase === "splash") {
      // splash will still play once, then short-circuit mood pop-up.
    }
  }, [user, today.loading, today.checkin, phase]);

  if (phase === "splash")
    return <Splash onDone={() => setPhase(today.checkin ? "ready" : "mood")} />;
  if (phase === "mood")
    return (
      <MoodCheckIn
        onDone={() => {
          setStreak((s) => s + 1);
          setPhase("ready");
        }}
        onSkip={() => setPhase("ready")}
      />
    );

  // Single source of truth — derived from the pop-up check-in.
  const mood = today.mood ?? MOODS[1];
  const message = today.message;
  const greeting = displayName ? `Chào ${displayName}` : "Chào bạn quay lại";
  const quote = DAILY_QUOTES[quoteIdx];

  return (
    <PageShell mascot={false}>
      {/* HERO cinematic — Hospital Playlist */}
      <section className="relative -mx-5 sm:mx-0 sm:rounded-[32px] overflow-hidden shadow-cinematic animate-[fade-up_0.6s_ease-out]">
        <img
          src={heroImage}
          alt="Hospital Playlist — hành lang bệnh viện ấm áp với ban nhạc"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "3px 3px" }}
        />

        <div className="relative px-6 sm:px-10 md:px-16 py-16 sm:py-24 md:py-32 max-w-3xl">
          <p className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.4em] text-warm font-semibold">
            <Music2 className="w-3.5 h-3.5" /> A healing playlist
          </p>
          <h2 className="mt-5 heading-cinematic text-white text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Hospital <span className="text-warm">Playlist</span>
          </h2>
          <p className="mt-6 font-serif italic text-white/90 text-base sm:text-lg md:text-xl leading-relaxed max-w-xl">
            Một playlist dịu dàng cho những ngày lòng bạn cần được lắng nghe.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/journal">
              <Button className="cta-glow rounded-full bg-warm hover:bg-warm/90 text-navy shadow-soft px-6 py-5 text-sm font-semibold">
                <PlayCircle className="w-4 h-4 mr-2 icon-bounce" /> Bắt đầu lắng nghe mình
                <span className="cta-arrow ml-1">→</span>
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" className="cta-glow cta-scrub rounded-full border-white/60 bg-white/10 text-white hover:bg-white/20 hover:text-white px-6 py-5 text-sm">
                <Stethoscope className="w-4 h-4 mr-2 icon-wiggle" /> Khám phá phác đồ chữa lành
              </Button>
            </Link>
          </div>

          {/* Sound wave decoration */}
          <div className="mt-10 hidden sm:flex items-end gap-1 h-8 opacity-70">
            {Array.from({ length: 32 }).map((_, i) => (
              <span
                key={i}
                className="w-[3px] bg-warm rounded-full animate-pulse"
                style={{ height: `${20 + Math.abs(Math.sin(i * 0.7)) * 80}%`, animationDelay: `${i * 0.05}s`, animationDuration: "1.6s" }}
              />
            ))}
          </div>
        </div>

        <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-10">
          <UserMenu />
        </div>
        <div className="absolute top-5 left-5 sm:top-6 sm:left-10 z-10 text-white/85 text-[10px] sm:text-xs uppercase tracking-[0.35em]">
          {greeting}
        </div>
      </section>

      {/* Playlist tracks — 6 tiện ích */}
      <SectionHeader kicker="Track list" title="Playlist chữa lành của bạn" />
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TRACKS.map((t) => {
          const Icon = t.icon;
          const warm = t.tone === "warm";
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`lift-card group relative rounded-[22px] bg-card border border-border/70 shadow-card p-5 flex gap-4 items-start overflow-hidden ${warm ? "tone-warm" : ""}`}
            >
              <div
                className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"
                style={{ background: warm ? "var(--warm-yellow)" : "var(--scrub-blue)" }}
              />
              <div
                className="relative w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center"
                style={{
                  background: warm ? "var(--soft-cream)" : "var(--mist-blue)",
                  color: warm ? "var(--blush-deep)" : "var(--primary-blue)",
                }}
              >
                <Icon className="w-6 h-6" strokeWidth={1.8} />
              </div>
              <div className="relative flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: warm ? "var(--blush-deep)" : "var(--primary-blue)" }}>
                  Track {t.n}
                </p>
                <h3 className="mt-1 font-display text-xl text-navy leading-tight group-hover:text-scrub transition-colors">
                  {t.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
              <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground group-hover:text-scrub group-hover:translate-x-1 transition-all" />
            </Link>
          );
        })}
      </section>

      {/* Mood capsule */}
      <section
        className="mt-6 rounded-3xl p-5 md:p-6 shadow-card relative overflow-hidden animate-[fade-up_0.6s_ease-out] border border-white/60"
        style={{ background: `color-mix(in oklch, ${mood.colorVar} 22%, white)` }}
      >
        <div className="flex items-center gap-3">
          {today.sticker ? (
            <MoodSticker sticker={today.sticker} size={48} />
          ) : (
            <span className="text-3xl">{mood.emoji}</span>
          )}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-foreground/60">Cảm xúc hôm nay</p>
            <p className="font-medium text-base capitalize">
              {today.adjective ?? mood.label}
            </p>
            {today.sticker && (
              <p className="text-[11px] text-foreground/50">{today.sticker.label}</p>
            )}
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] uppercase tracking-widest text-foreground/60">Streak</p>
            <p className="font-medium text-base">{streak} ngày</p>
          </div>
        </div>
        <p className="mt-3 italic text-foreground/75 leading-relaxed text-sm">"{message}"</p>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <Link to="/mood">
            <Button variant="ghost" size="sm" className="rounded-full text-mint-deep hover:bg-white/40 px-3 -ml-2">
              Hành trình cảm xúc <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
          <Link to="/mood-board">
            <Button variant="ghost" size="sm" className="rounded-full text-mint-deep hover:bg-white/40 px-3">
              <Globe2 className="w-3.5 h-3.5 mr-1.5" /> Không gian kết nối
            </Button>
          </Link>
        </div>
      </section>

      {/* Daily quote spotlight */}
      <SectionHeader kicker="vitamin tâm hồn" title="Một câu dịu dàng hôm nay" />
      <section className="relative rounded-[28px] bg-card border border-mint/30 shadow-card p-8 md:p-10 overflow-hidden">
        <QuoteIcon className="absolute top-4 left-4 w-16 h-16 text-mint/40" strokeWidth={1} />
        <QuoteIcon className="absolute bottom-4 right-4 w-16 h-16 text-mint/30 rotate-180" strokeWidth={1} />
        <div className="relative text-center max-w-xl mx-auto">
          <p className="font-display text-lg md:text-2xl leading-[1.55] text-foreground/85 italic">
            "{quote.text}"
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.25em] text-mint-deep">— {quote.source}</p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setQuoteIdx((i) => (i - 1 + DAILY_QUOTES.length) % DAILY_QUOTES.length)}
              className="rounded-full text-muted-foreground hover:text-mint-deep"
            >
              ← Trước
            </Button>
            <Link to="/vitamin">
              <Button size="sm" variant="outline" className="rounded-full border-mint-deep/40 text-mint-deep hover:bg-mint/30">
                <Heart className="w-3.5 h-3.5 mr-1.5" /> Lưu vào album
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setQuoteIdx((i) => (i + 1) % DAILY_QUOTES.length)}
              className="rounded-full text-muted-foreground hover:text-mint-deep"
            >
              Câu tiếp →
            </Button>
          </div>
        </div>
      </section>

      {/* Healing suggestions */}
      <SectionHeader kicker="góc chữa lành" title="Gợi ý cho bạn hôm nay" />
      <section className="grid md:grid-cols-2 gap-4">
        {HEALING_SUGGESTIONS.map((s) => (
          <Link
            key={s.title}
            to={s.to}
            className="group rounded-3xl bg-card border border-border/60 shadow-card p-5 flex gap-4 items-start hover:-translate-y-0.5 hover:shadow-soft transition-all duration-300"
          >
            <div
              className="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center text-mint-deep"
              style={{ background: `color-mix(in oklch, ${s.tint} 55%, white)` }}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[10px] uppercase tracking-[0.2em] text-mint-deep bg-mint/30 rounded-full px-2.5 py-0.5">
                {s.tag}
              </span>
              <h3 className="mt-2 font-display font-medium text-base text-foreground/90 group-hover:text-mint-deep transition-colors">
                {s.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Emotion collections */}
      <SectionHeader kicker="góc cảm xúc" title="Chọn một góc cho hôm nay" />
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {EMOTION_CORNERS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActiveCorner(c)}
            className="group text-left rounded-3xl bg-card border border-border/60 shadow-card p-5 hover:-translate-y-0.5 hover:shadow-soft hover:bg-gradient-to-br hover:from-white hover:to-mint/15 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint-deep/40"
          >
            <div className="w-14 h-14 rounded-2xl bg-mint/30 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
              {c.emoji}
            </div>
            <h4 className="mt-3 font-display text-sm md:text-base text-foreground/90 leading-snug group-hover:text-mint-deep transition-colors">
              {c.title}
            </h4>
            <p className="mt-1 text-[11px] md:text-xs text-muted-foreground italic">{c.desc}</p>
            <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-mint-deep/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              Chạm để mở góc này <ChevronRight className="w-3 h-3" />
            </p>
          </button>
        ))}
      </section>

      <EmotionCornerDialog
        corner={activeCorner}
        open={!!activeCorner}
        onOpenChange={(o) => !o && setActiveCorner(null)}
      />

      {/* Private journal */}
      <section className="mt-12 mb-6 relative rounded-[28px] overflow-hidden border border-mint/40 shadow-card">
        <div className="absolute inset-0 bg-gradient-welcome opacity-90" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-6 p-8 md:p-10">
          <div>
            <div className="inline-flex items-center gap-2 text-mint-deep mb-3">
              <Lock className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-[0.25em]">không gian riêng</span>
            </div>
            <h3 className="font-display text-2xl md:text-3xl text-foreground/90 leading-tight">
              Một căn phòng nhỏ chỉ dành cho bạn
            </h3>
            <p className="mt-3 text-sm text-muted-foreground max-w-md leading-relaxed">
              Viết ra những điều bạn chưa thể nói với ai. Nhật ký được bảo vệ riêng tư để bạn cảm thấy an toàn.
            </p>
            <Link to="/journal">
              <Button className="mt-5 rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white shadow-soft">
                <BookHeart className="w-4 h-4 mr-2" /> Mở phòng nhật ký
              </Button>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full bg-mint/40 blur-2xl" />
              <div className="relative animate-[float_6s_ease-in-out_infinite]">
                <Mascot size="md" variant="comfort" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Breathing CTA */}
      <section className="mb-10 rounded-3xl p-5 glass shadow-card flex items-center gap-4 border border-white/60">
        <div className="w-12 h-12 rounded-2xl bg-mint/40 flex items-center justify-center text-mint-deep">
          <Wind className="w-6 h-6 animate-breathe" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Hít thở 1 phút cùng mascot</p>
          <p className="text-xs text-muted-foreground">Hít vào — giữ — thở ra. Chỉ vậy thôi.</p>
        </div>
        <Button
          size="sm"
          className="rounded-full bg-blush-deep hover:bg-blush-deep/90 text-white"
          onClick={() => setBreathingOpen(true)}
        >
          Bắt đầu
        </Button>
      </section>

      <BreathingDialog open={breathingOpen} onClose={() => setBreathingOpen(false)} />

      {/* Footer */}
      <footer className="text-center pb-6 pt-2 text-muted-foreground">
        <p className="font-display text-sm">Hospital Playlist</p>
        <p className="text-[11px] italic mt-1">A gentle place for your inner world.</p>
      </footer>
    </PageShell>
  );
}

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mt-12 mb-5 text-center">
      <p className="text-[10px] uppercase tracking-[0.3em] text-mint-deep/80">{kicker}</p>
      <h2 className="mt-2 font-display text-xl md:text-2xl text-foreground/90">{title}</h2>
      <div className="mt-3 mx-auto w-12 h-px bg-mint-deep/30" />
    </div>
  );
}
