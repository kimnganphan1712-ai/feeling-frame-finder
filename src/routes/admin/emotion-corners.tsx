import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { listEmotionCornerEvents, type EmotionEventRow } from "@/lib/emotion-corner-analytics";
import { EMOTION_CORNERS } from "@/components/EmotionCornerDialog";

export const Route = createFileRoute("/admin/emotion-corners")({
  component: () => (
    <RequireAdmin>
      <EmotionCornerAnalytics />
    </RequireAdmin>
  ),
});

const RANGES = [
  { label: "7 ngày", value: 7 },
  { label: "30 ngày", value: 30 },
  { label: "90 ngày", value: 90 },
];

function EmotionCornerAnalytics() {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<EmotionEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listEmotionCornerEvents(days)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [days]);

  const stats = useMemo(() => {
    const byCorner = new Map<string, { open: number; cta: number; random: number; ctas: Map<string, number> }>();
    for (const r of rows) {
      const cur = byCorner.get(r.corner_key) ?? { open: 0, cta: 0, random: 0, ctas: new Map<string, number>() };
      if (r.event_type === "open") cur.open++;
      else if (r.event_type === "cta_click") {
        cur.cta++;
        const key = r.cta_label ?? "(không tên)";
        cur.ctas.set(key, (cur.ctas.get(key) ?? 0) + 1);
      } else if (r.event_type === "random_quote") cur.random++;
      byCorner.set(r.corner_key, cur);
    }
    return byCorner;
  }, [rows]);

  const totals = useMemo(() => {
    let open = 0, cta = 0, random = 0;
    for (const v of stats.values()) { open += v.open; cta += v.cta; random += v.random; }
    return { open, cta, random };
  }, [stats]);

  return (
    <PageShell mascot={false}>
      <header className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <Link to="/admin/dashboard" className="inline-flex items-center text-xs text-mint-deep/80 hover:text-mint-deep mb-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Quay lại trang quản trị
          </Link>
          <h1 className="text-2xl md:text-3xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-mint-deep" />
            Tương tác Góc cảm xúc
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi người dùng mở từng góc và chọn hành động chữa lành nào.
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-mint/20 p-1">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={days === r.value ? "default" : "ghost"}
              onClick={() => setDays(r.value)}
              className={days === r.value ? "rounded-full bg-mint-deep text-white hover:bg-mint-deep/90" : "rounded-full"}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3 mb-8">
        <SummaryCard label="Lượt mở" value={totals.open} />
        <SummaryCard label="Lượt chọn CTA" value={totals.cta} />
        <SummaryCard label="Đổi lời nhắn" value={totals.random} />
      </section>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải dữ liệu…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl glass border border-white/60 p-10 text-center text-muted-foreground">
          Chưa có lượt tương tác nào trong khoảng thời gian này.
        </div>
      ) : (
        <section className="space-y-4">
          {EMOTION_CORNERS.map((c) => {
            const s = stats.get(c.key);
            if (!s) return null;
            const ctaList = Array.from(s.ctas.entries()).sort((a, b) => b[1] - a[1]);
            const conversion = s.open > 0 ? Math.round((s.cta / s.open) * 100) : 0;
            return (
              <div key={c.key} className="rounded-3xl glass border border-white/60 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-mint/30 flex items-center justify-center text-2xl">{c.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg text-foreground/90">{c.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {s.open} lượt mở · {s.cta} CTA · {s.random} đổi lời nhắn · tỷ lệ click {conversion}%
                    </p>
                  </div>
                </div>
                {ctaList.length > 0 && (
                  <div className="space-y-2">
                    {ctaList.map(([label, count]) => {
                      const pct = s.cta > 0 ? Math.round((count / s.cta) * 100) : 0;
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground/80">{label}</span>
                            <span className="text-muted-foreground">{count} · {pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-mint/15 overflow-hidden">
                            <div className="h-full bg-mint-deep/70 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </PageShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl glass border border-white/60 p-4 text-center">
      <p className="text-[10px] uppercase tracking-[0.2em] text-mint-deep/80">{label}</p>
      <p className="font-display text-2xl mt-1">{value}</p>
    </div>
  );
}
