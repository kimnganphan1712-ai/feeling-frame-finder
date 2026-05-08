import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vitaminStore } from "@/lib/vitamin-store";
import { useAuth } from "@/lib/auth-context";

export function SubmitQuoteDialog({ open, onClose, onSubmitted }: { open: boolean; onClose: () => void; onSubmitted?: () => void }) {
  const { displayName } = useAuth();
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [work, setWork] = useState("");
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const [anon, setAnon] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setErr(""); setBusy(true);
    const res = await vitaminStore.submitQuote({
      content, author_name: author, work_title: work, source_text: source, note,
      display_name: anon ? undefined : displayName ?? undefined,
    });
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    setDone(true);
    onSubmitted?.();
    setTimeout(() => {
      setContent(""); setAuthor(""); setWork(""); setSource(""); setNote(""); setDone(false);
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-[fade-up_0.3s_ease-out]">
      <div className="bg-card rounded-3xl shadow-soft max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-semibold">Gửi một câu nói</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Câu nói sẽ được kiểm duyệt trước khi xuất hiện công khai. Hãy ghi rõ nguồn để tôn trọng tác giả.
        </p>

        {done ? (
          <div className="mt-6 text-center py-8">
            <div className="text-3xl">🌿</div>
            <p className="mt-3 text-sm text-foreground/80">Cảm ơn bạn — câu nói đang chờ duyệt.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Field label="Nội dung câu nói *">
              <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={1000}
                placeholder="Câu nói chạm đến bạn…"
                className="w-full min-h-[100px] rounded-2xl bg-muted p-3 text-sm outline-none focus:ring-2 focus:ring-mint-deep/40 resize-none" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tác giả">
                <input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={120}
                  placeholder="Ví dụ: Nguyễn Phong Việt"
                  className="w-full rounded-2xl bg-muted p-3 text-sm outline-none focus:ring-2 focus:ring-mint-deep/40" />
              </Field>
              <Field label="Tác phẩm / sách / phim">
                <input value={work} onChange={(e) => setWork(e.target.value)} maxLength={160}
                  placeholder="Ví dụ: Đi qua thương nhớ"
                  className="w-full rounded-2xl bg-muted p-3 text-sm outline-none focus:ring-2 focus:ring-mint-deep/40" />
              </Field>
            </div>
            <Field label="Nguồn khác (link, bài viết…)">
              <input value={source} onChange={(e) => setSource(e.target.value)} maxLength={300}
                placeholder="Có thể để trống nếu đã có tác giả/tác phẩm"
                className="w-full rounded-2xl bg-muted p-3 text-sm outline-none focus:ring-2 focus:ring-mint-deep/40" />
            </Field>
            <Field label="Ghi chú (không bắt buộc)">
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200}
                className="w-full rounded-2xl bg-muted p-3 text-sm outline-none focus:ring-2 focus:ring-mint-deep/40" />
            </Field>
            <label className="flex items-center gap-2 text-sm text-foreground/80 mt-1">
              <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="accent-mint-deep" />
              Gửi ẩn danh
            </label>
            <p className="text-[11px] text-muted-foreground -mt-1">Cần ít nhất một trong: tác giả, tác phẩm, hoặc nguồn.</p>

            {err && <div className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">{err}</div>}

            <Button onClick={submit} disabled={busy} className="w-full rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gửi câu nói"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
