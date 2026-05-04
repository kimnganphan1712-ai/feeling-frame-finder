import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Splash } from "@/components/Splash";
import { MoodCheckIn } from "@/components/MoodCheckIn";
import { PageShell } from "@/components/PageShell";
import { Mascot } from "@/components/Mascot";
import { RequireAuth } from "@/components/RequireAuth";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/lib/auth-context";
import { cloudStore } from "@/lib/cloud-store";
import { MOODS, MoodKey, getMoodMessage } from "@/lib/mood";
import { Button } from "@/components/ui/button";
import { Headphones, BookHeart, Sparkles, Wind, Flame } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <RequireAuth>
      <HomePage />
    </RequireAuth>
  ),
});

const QUOTE = "Bạn không cần phải vội vàng chữa lành. Cây cối còn cần cả mùa đông để đâm chồi lại.";

function HomePage() {
  const { user, displayName } = useAuth();
  const [phase, setPhase] = useState<"splash" | "mood" | "ready">("splash");
  const [todayMood, setTodayMood] = useState<MoodKey | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const mood = await cloudStore.getTodayMood(user.id);
      const history = await cloudStore.getMoodHistory(user.id);
      setStreak(history.length);
      if (mood) {
        setTodayMood(mood);
        setPhase("ready");
      }
    })();
  }, [user]);

  if (phase === "splash") return <Splash onDone={() => setPhase("mood")} />;
  if (phase === "mood")
    return (
      <MoodCheckIn
        onDone={async (m) => {
          if (user) await cloudStore.setTodayMood(user.id, m);
          setTodayMood(m);
          setStreak((s) => s + 1);
          setPhase("ready");
        }}
      />
    );

  const mood = MOODS.find((m) => m.key === todayMood) ?? MOODS[1];
  const message = todayMood ? getMoodMessage(todayMood) : "";
  const greeting = displayName ? `Chào ${displayName} 🌿` : "Chào bạn quay lại 🌿";

  return (
    <PageShell>
      <header className="flex items-start justify-between mb-6 gap-3 animate-[fade-up_0.6s_ease-out]">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Trạm Dịu</p>
          <h1 className="text-2xl md:text-3xl font-semibold mt-1 truncate">{greeting}</h1>
        </div>
        <UserMenu />
      </header>

      <section
        className="rounded-3xl p-6 shadow-card relative overflow-hidden animate-[fade-up_0.6s_ease-out]"
        style={{ background: `color-mix(in oklch, ${mood.colorVar} 25%, white)` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">{mood.emoji}</span>
          <div>
            <p className="text-xs text-foreground/60">Cảm xúc hôm nay</p>
            <p className="font-semibold text-lg">{mood.label}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-foreground/60">Streak</p>
            <p className="font-semibold text-lg">{streak} ngày</p>
          </div>
        </div>
        <p className="mt-4 italic text-foreground/80 leading-relaxed text-sm md:text-base">
          "{message}"
        </p>
        <Link to="/mood">
          <Button variant="ghost" size="sm" className="mt-3 rounded-full text-mint-deep hover:bg-white/40">
            Xem hành trình cảm xúc →
          </Button>
        </Link>
      </section>

      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Gợi ý cho hôm nay</h2>
        <div className="grid gap-3">
          <SuggestCard
            to="/podcast"
            icon={<Headphones className="w-5 h-5" />}
            title="Bài học #3 — Gọi tên cảm xúc"
            sub="14 phút • Podcast nền tảng"
            tint="var(--mint)"
          />
          <SuggestCard
            to="/vitamin"
            icon={<Sparkles className="w-5 h-5" />}
            title="Một câu nói cho hôm nay"
            sub={`"${QUOTE}"`}
            tint="var(--blush)"
            small
          />
          <SuggestCard
            to="/journal"
            icon={<BookHeart className="w-5 h-5" />}
            title="Viết một dòng vào nhật ký"
            sub="Một câu cũng đủ. Không ai đọc ngoài bạn."
            tint="var(--mint)"
          />
        </div>
      </section>

      <section className="mt-8 rounded-3xl p-5 glass shadow-card flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-mint/40 flex items-center justify-center text-mint-deep">
          <Wind className="w-6 h-6 animate-breathe" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Hít thở 1 phút cùng mascot</p>
          <p className="text-xs text-muted-foreground">Hít vào — giữ — thở ra. Chỉ vậy thôi.</p>
        </div>
        <Button size="sm" className="rounded-full bg-blush-deep hover:bg-blush-deep/90 text-white">
          <Flame className="w-4 h-4 mr-1" /> Bắt đầu
        </Button>
      </section>
    </PageShell>
  );
}

function SuggestCard({
  to, icon, title, sub, tint, small,
}: {
  to: "/podcast" | "/vitamin" | "/journal";
  icon: React.ReactNode;
  title: string;
  sub: string;
  tint: string;
  small?: boolean;
}) {
  return (
    <Link
      to={to}
      className="rounded-3xl p-4 shadow-card glass flex items-start gap-3 hover:scale-[1.01] transition-all duration-200 border border-white/60"
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in oklch, ${tint} 50%, white)`, color: "var(--mint-deep)" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className={`text-xs text-muted-foreground mt-0.5 ${small ? "italic" : ""} line-clamp-2`}>{sub}</p>
      </div>
    </Link>
  );
}
