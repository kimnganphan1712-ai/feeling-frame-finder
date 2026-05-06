import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { MoodSticker } from "@/components/MoodSticker";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Globe2, Trash2 } from "lucide-react";
import { moodCheckinStore, MoodCheckin } from "@/lib/mood-checkin-store";
import { STICKERS } from "@/lib/stickers";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/mood-board")({
  component: () => (
    <RequireAuth>
      <MoodBoardPage />
    </RequireAuth>
  ),
});

interface Placed extends MoodCheckin {
  left: number; // %
  top: number;  // %
  rot: number;  // deg
}

// Deterministic pseudo-random based on id so positions are stable per item
function seeded(id: string, salt: number) {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

function MoodBoardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MoodCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    moodCheckinStore.listRecentPublic(80).then((rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    // best-effort admin check via profile role; ignore failure
    (async () => {
      if (!user) return;
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      setIsAdmin(data?.role === "admin");
    })();
  }, [user]);

  const placed: Placed[] = useMemo(() => {
    // grid-aware scatter: distribute across rows then jitter
    const cols = 4;
    return items.map((it, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const baseX = (col + 0.5) * (100 / cols);
      const baseY = row * 130 + 80; // px-ish offsets handled via top%
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

  const totalHeight = Math.max(800, Math.ceil(items.length / 4) * 170 + 200);

  const handleDelete = async (id: string) => {
    if (!confirm("Xoá mood này?")) return;
    const res = await moodCheckinStore.deleteOne(id);
    if (!res.error) setItems((arr) => arr.filter((x) => x.id !== id));
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: "linear-gradient(180deg, #fbfaf6 0%, #f4f6f3 100%)",
        backgroundImage:
          "linear-gradient(180deg, #fbfaf6 0%, #f4f6f3 100%), repeating-linear-gradient(0deg, rgba(120,140,120,0.06) 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, rgba(120,140,120,0.06) 0 1px, transparent 1px 32px)",
        backgroundBlendMode: "normal",
      }}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/40 border-b border-white/60">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ChevronLeft className="w-4 h-4 mr-1" /> Trở về
            </Button>
          </Link>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-mint-deep/80">Soul Space</p>
            <h1 className="font-display text-base md:text-lg">Bản đồ cảm xúc</h1>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/70 border border-white/70 flex items-center justify-center text-mint-deep">
            <Globe2 className="w-4 h-4" />
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 pt-8 pb-4 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-mint-deep/80">global mood board</p>
        <h2 className="mt-2 font-display text-2xl md:text-3xl text-foreground/85">
          Hôm nay mọi người đang cảm thấy thế nào
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto italic">
          Mỗi sticker là một người đang cùng thở với bạn — chỉ một tính từ, không phán xét.
        </p>
      </section>

      <div
        className="relative max-w-5xl mx-auto px-2 md:px-4"
        style={{ height: totalHeight }}
      >
        {loading && (
          <div className="text-center text-muted-foreground py-12 text-sm">Đang tải bản đồ…</div>
        )}
        {!loading && items.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-sm">Chưa có ai gửi cảm xúc hôm nay.</p>
            <p className="text-xs mt-1 italic">Bạn có thể là người đầu tiên gọi tên cảm xúc của mình.</p>
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
