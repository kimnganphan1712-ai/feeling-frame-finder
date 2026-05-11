import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, Globe2, MessageCircle, Trash2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { MoodSticker } from "@/components/MoodSticker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { moodCheckinStore, MoodCheckin } from "@/lib/mood-checkin-store";
import { STICKERS } from "@/lib/stickers";
import { useAuth } from "@/lib/auth-context";
import { siteSettingsStore, SITE_KEYS } from "@/lib/site-settings-store";
import { CinematicBanner } from "@/components/CinematicBanner";
import { IMAGE_SLOTS } from "@/lib/site-images-store";
import moodBoardFallback from "@/assets/hp-friends.jpg";
import { cn, localDateKey } from "@/lib/utils";

export const Route = createFileRoute("/mood-board")({
  component: () => (
    <RequireAuth>
      <MoodBoardPage />
    </RequireAuth>
  ),
});

interface Placed extends MoodCheckin {
  left: number;
  top: number;
  rot: number;
}

function seeded(id: string, salt: number) {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

function dateKeyFromDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function MoodBoardPage() {
  const { user } = useAuth();
  const todayKey = localDateKey();
  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dateKeyFromDate(d);
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedKey = dateKeyFromDate(selectedDate);

  const [items, setItems] = useState<MoodCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [discordUrl, setDiscordUrl] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    moodCheckinStore.listPublicByDate(selectedKey).then((rows) => {
      setItems(rows);
      setLoading(false);
    });
    siteSettingsStore.get(SITE_KEYS.discordInvite).then(setDiscordUrl);
  }, [selectedKey]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      setIsAdmin(data?.role === "admin");
    })();
  }, [user]);

  // Aggregate by mood for stats
  const stats = useMemo(() => {
    const map = new Map<string, { count: number; sample: MoodCheckin }>();
    for (const it of items) {
      const cur = map.get(it.sticker_type);
      if (cur) cur.count += 1;
      else map.set(it.sticker_type, { count: 1, sample: it });
    }
    return Array.from(map.entries())
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  const placed: Placed[] = useMemo(() => {
    const cols = 4;
    return items.map((it, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const baseX = (col + 0.5) * (100 / cols);
      const baseY = row * 130 + 80;
      const jitterX = (seeded(it.id, 7) - 0.5) * 14;
      const jitterY = (seeded(it.id, 13) - 0.5) * 30;
      const rot = (seeded(it.id, 23) - 0.5) * 10;
      return {
        ...it,
        left: Math.max(6, Math.min(94, baseX + jitterX)),
        top: baseY + jitterY,
        rot,
      };
    });
  }, [items]);

  const totalHeight = Math.max(500, Math.ceil(items.length / 4) * 170 + 200);

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá cảm xúc này khỏi bản đồ?")) return;
    const res = await moodCheckinStore.deleteOne(id);
    if (!res.error) setItems((arr) => arr.filter((x) => x.id !== id));
  };

  const isToday = selectedKey === todayKey;
  const isYesterday = selectedKey === yesterdayKey;
  const dateLabelLong = isToday
    ? "hôm nay"
    : isYesterday
      ? "hôm qua"
      : `ngày ${format(selectedDate, "dd/MM/yyyy", { locale: vi })}`;

  const setQuickDate = (kind: "today" | "yesterday") => {
    const d = new Date();
    if (kind === "yesterday") d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage:
          "linear-gradient(180deg, #fbfaf6 0%, #f4f6f3 100%), repeating-linear-gradient(0deg, rgba(120,140,120,0.06) 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, rgba(120,140,120,0.06) 0 1px, transparent 1px 32px)",
      }}
    >
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/40 border-b border-white/60">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ChevronLeft className="w-4 h-4 mr-1" /> Trở về
            </Button>
          </Link>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-mint-deep/80">Hospital Playlist</p>
            <h1 className="font-display text-base md:text-lg">Không gian kết nối</h1>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/70 border border-white/70 flex items-center justify-center text-mint-deep">
            <Globe2 className="w-4 h-4" />
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 pt-6">
        <CinematicBanner
          slot={IMAGE_SLOTS.moodBoardBanner}
          fallbackSrc={moodBoardFallback}
          kicker="Track 04 — Connection"
          title="Trạm kết nối"
          subtitle="Trong những ngày nhiều cảm xúc, có rất nhiều người cũng đang cùng thở với bạn."
          height="md"
        />
      </section>

      {/* Discord card */}
      <section className="max-w-5xl mx-auto px-4 pt-6 pb-6">
        <div className="group lift-card rounded-3xl glass border border-white/60 p-5 md:p-6 flex items-center gap-4 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-mint/40 flex items-center justify-center text-mint-deep shrink-0 icon-bounce">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-base md:text-lg text-foreground/90">Cộng đồng Discord</p>
            {discordUrl ? (
              <p className="text-xs text-muted-foreground italic">Một góc nhỏ để cùng nhau lắng nghe và sẻ chia.</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Không gian kết nối đang được chuẩn bị. Bác sĩ cảm xúc sẽ mở cửa sớm thôi.
              </p>
            )}
          </div>
          {discordUrl && (
            <a href={discordUrl} target="_blank" rel="noreferrer">
              <Button size="sm" className="cta-glow cta-scrub rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
                Tham gia <span className="cta-arrow ml-1">→</span>
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Mood board section */}
      <section className="max-w-5xl mx-auto px-4 pb-2 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-mint-deep/80">global mood board</p>
        <h3 className="mt-2 font-display text-xl md:text-2xl text-foreground/85">
          Bản đồ cảm xúc cộng đồng
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto italic">
          Những cảm xúc được chia sẻ vào {dateLabelLong}. Mỗi người chỉ để lại một dấu cảm xúc trong ngày.
        </p>
      </section>

      {/* Date filter */}
      <section className="max-w-5xl mx-auto px-4 pt-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            size="sm"
            variant={isToday ? "default" : "outline"}
            onClick={() => setQuickDate("today")}
            className={cn("rounded-full", isToday && "bg-mint-deep hover:bg-mint-deep/90 text-white")}
          >
            Hôm nay
          </Button>
          <Button
            size="sm"
            variant={isYesterday ? "default" : "outline"}
            onClick={() => setQuickDate("yesterday")}
            className={cn("rounded-full", isYesterday && "bg-mint-deep hover:bg-mint-deep/90 text-white")}
          >
            Hôm qua
          </Button>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant={!isToday && !isYesterday ? "default" : "outline"}
                className={cn(
                  "rounded-full",
                  !isToday && !isYesterday && "bg-mint-deep hover:bg-mint-deep/90 text-white",
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                {!isToday && !isYesterday
                  ? format(selectedDate, "dd/MM/yyyy", { locale: vi })
                  : "Chọn ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  if (d) {
                    setSelectedDate(d);
                    setPickerOpen(false);
                  }
                }}
                disabled={(date) => date > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </section>

      {/* Stats summary */}
      {!loading && items.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pt-6">
          <div className="lift-card rounded-3xl glass border border-white/60 p-4 md:p-5 shadow-card">
            <p className="text-[11px] uppercase tracking-[0.25em] text-mint-deep/80 text-center mb-3">
              Tổng quan {dateLabelLong}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {stats.map((s) => {
                const sticker = STICKERS.find((x) => x.type === s.type) ?? {
                  type: s.type,
                  label: s.sample.adjective,
                  color: s.sample.sticker_color,
                  face: "calm" as const,
                };
                return (
                  <div
                    key={s.type}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-white/70"
                  >
                    <MoodSticker sticker={sticker} size={28} />
                    <span className="text-xs text-foreground/80">{sticker.label}</span>
                    <span className="text-xs font-semibold text-mint-deep">{s.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Sticker scatter */}
      <div
        className="relative max-w-5xl mx-auto px-2 md:px-4 mt-6"
        style={{ height: items.length === 0 ? 240 : totalHeight }}
      >
        {loading && (
          <div className="text-center text-muted-foreground py-12 text-sm">Đang tải bản đồ…</div>
        )}
        {!loading && items.length === 0 && (
          <div className="text-center py-12 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground">
              {isToday
                ? "Hôm nay chưa có ai gửi cảm xúc vào bản đồ cộng đồng."
                : `Chưa có cập nhật cảm xúc nào cho ${dateLabelLong}.`}
            </p>
            <p className="text-xs mt-2 italic text-muted-foreground/80">
              {isToday
                ? "Hãy là người đầu tiên gọi tên cảm xúc của mình."
                : "Bản đồ ngày này hiện đang yên lặng."}
            </p>
          </div>
        )}

        {placed.map((it) => {
          const sticker = STICKERS.find((s) => s.type === it.sticker_type) ?? {
            type: it.sticker_type,
            label: it.adjective,
            color: it.sticker_color,
            face: "calm" as const,
          };
          return (
            <div
              key={it.id}
              className="absolute -translate-x-1/2 group"
              style={{ left: `${it.left}%`, top: it.top, transform: `translate(-50%, 0) rotate(${it.rot}deg)` }}
            >
              <div className="flex flex-col items-center text-center">
                <MoodSticker sticker={sticker} size={56} />
                <p className="mt-2 font-display text-sm text-foreground/85 capitalize leading-tight max-w-[120px]">
                  {it.adjective}
                </p>
                <p className="text-[11px] text-muted-foreground/80 leading-tight max-w-[120px] truncate">
                  {it.username}
                </p>
                {(isAdmin || it.user_id === user?.id) && (
                  <button
                    onClick={() => handleDelete(it.id)}
                    title="Xoá"
                    className="mt-1 opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-blush-deep"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="text-center pb-10 pt-6 text-muted-foreground">
        <p className="text-[11px] italic">
          Một cộng đồng nhỏ đang cùng thở và gọi tên cảm xúc của mình.
        </p>
      </footer>
    </div>
  );
}
