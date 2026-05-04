import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, Plus, X } from "lucide-react";

export const Route = createFileRoute("/vitamin")({
  component: () => (
    <RequireAuth>
      <VitaminPage />
    </RequireAuth>
  ),
});

const QUOTES = [
  "Bạn không cần phải vội vàng chữa lành. Cây cối còn cần cả mùa đông để đâm chồi lại.",
  "Đôi khi điều dũng cảm nhất một người có thể làm — là nghỉ ngơi.",
  "Mình không phải lúc nào cũng phải hiểu vì sao mình buồn. Chỉ cần biết rằng mình đang buồn — và mình vẫn ổn.",
  "Hãy đối xử với chính mình như cách bạn đối xử với một người bạn đang khóc.",
  "Có những ngày, làm xong một bữa ăn cũng đã là chiến thắng.",
  "Bạn không cần phải xứng đáng với tình yêu thương. Bạn vốn đã đủ rồi.",
];

function VitaminPage() {
  const [idx, setIdx] = useState(0);
  const [saved, setSaved] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const next = () => setIdx((i) => (i + 1) % QUOTES.length);
  const prev = () => setIdx((i) => (i - 1 + QUOTES.length) % QUOTES.length);
  const toggleSave = () => setSaved((s) => (s.includes(idx) ? s.filter((x) => x !== idx) : [...s, idx]));

  return (
    <PageShell>
      <header className="flex items-start justify-between mb-6 animate-[fade-up_0.6s_ease-out]">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Vitamin tâm hồn</p>
          <h1 className="text-3xl font-semibold mt-1">Một câu nói, một liều dịu</h1>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="rounded-full bg-blush-deep hover:bg-blush-deep/90 text-white">
          <Plus className="w-4 h-4 mr-1" /> Gửi câu nói
        </Button>
      </header>

      {/* Quote card — swipeable feel */}
      <div className="relative h-[380px] flex items-center justify-center animate-[fade-up_0.6s_ease-out]">
        {[idx + 2, idx + 1, idx].map((i, layer) => {
          const q = QUOTES[i % QUOTES.length];
          return (
            <article
              key={i}
              className="absolute inset-x-0 mx-auto max-w-md rounded-3xl shadow-card glass-strong border border-white/60 p-8 transition-all duration-500"
              style={{
                transform: `translateY(${layer * 14}px) scale(${1 - layer * 0.04})`,
                opacity: 1 - layer * 0.35,
                zIndex: 10 - layer,
              }}
            >
              <div className="text-5xl text-mint-deep/40 leading-none">"</div>
              <p className="mt-2 text-lg md:text-xl leading-relaxed text-foreground/90 italic">{q}</p>
              <p className="mt-6 text-xs text-muted-foreground">— Ẩn danh</p>
            </article>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <Button onClick={prev} variant="ghost" size="sm" className="rounded-full">← Trước</Button>
        <Button
          onClick={toggleSave}
          variant="ghost"
          size="icon"
          className={`rounded-full ${saved.includes(idx) ? "text-blush-deep bg-blush/40" : ""}`}
        >
          <Bookmark className="w-5 h-5" fill={saved.includes(idx) ? "currentColor" : "none"} />
        </Button>
        <Button onClick={next} className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">Câu tiếp →</Button>
      </div>

      {/* Collection */}
      <section className="mt-10">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Bộ sưu tập của bạn ({saved.length})</h2>
        {saved.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Chưa có câu nào — chạm vào dấu trang để lưu lại câu bạn yêu.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {saved.map((i) => (
              <div key={i} className="rounded-2xl p-4 glass shadow-card text-sm italic text-foreground/80 border border-white/60">
                "{QUOTES[i]}"
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Submit modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-[fade-up_0.3s_ease-out]">
          <div className="bg-card rounded-3xl shadow-soft max-w-md w-full p-6 relative">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold">Gửi một câu nói</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Câu nói sẽ được công khai ẩn danh. Không ai biết là của bạn — chỉ có sự chữa lành được lan đi.
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Câu nói, trích dẫn từ sách, lời thoại phim…"
              className="w-full mt-4 min-h-[120px] rounded-2xl bg-muted p-3 text-sm outline-none focus:ring-2 focus:ring-mint-deep/40 resize-none"
            />
            <Button
              onClick={() => { setDraft(""); setOpen(false); }}
              disabled={!draft.trim()}
              className="mt-4 w-full rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white"
            >
              Gửi vào kho dịu
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
