import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, ArrowLeft, Edit2, Save } from "lucide-react";
import { vitaminStore, type Quote, type QuoteStatus } from "@/lib/vitamin-store";

export const Route = createFileRoute("/admin/quotes")({
  component: () => <RequireAdmin><AdminQuotes /></RequireAdmin>,
});

function AdminQuotes() {
  const [tab, setTab] = useState<QuoteStatus>("pending");
  const [items, setItems] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<Quote>>({});

  const reload = async () => {
    setLoading(true);
    setItems(await vitaminStore.listByStatus(tab));
    setLoading(false);
  };
  useEffect(() => { reload(); }, [tab]);

  const approve = async (q: Quote) => {
    await vitaminStore.approveQuote(q.id, editId === q.id ? edit : undefined);
    setEditId(null); setEdit({});
    reload();
  };
  const reject = async (q: Quote) => {
    const reason = prompt("Lý do từ chối (tuỳ chọn):") ?? undefined;
    await vitaminStore.rejectQuote(q.id, reason);
    reload();
  };

  return (
    <PageShell mascot={false}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/dashboard"><Button variant="ghost" size="sm" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-semibold">Kiểm duyệt câu nói</h1>
            <p className="text-xs text-muted-foreground">Duyệt, từ chối hoặc chỉnh sửa câu nói do người dùng gửi.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {(["pending", "approved", "rejected"] as QuoteStatus[]).map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${tab === s ? "bg-mint-deep text-white" : "bg-muted text-foreground/70 hover:bg-mint/30"}`}>
            {s === "pending" ? "Chờ duyệt" : s === "approved" ? "Đã duyệt" : "Từ chối"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-mint-deep" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground italic py-12">Không có câu nói nào.</p>
      ) : (
        <div className="space-y-3">
          {items.map((q) => {
            const isEditing = editId === q.id;
            return (
              <div key={q.id} className="rounded-3xl bg-card border border-border p-5 shadow-card">
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea defaultValue={q.content} onChange={(e) => setEdit((s) => ({ ...s, content: e.target.value }))}
                      className="w-full min-h-[80px] rounded-xl bg-muted p-2 text-sm resize-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <input defaultValue={q.author_name ?? ""} placeholder="Tác giả" onChange={(e) => setEdit((s) => ({ ...s, author_name: e.target.value }))}
                        className="rounded-xl bg-muted p-2 text-xs" />
                      <input defaultValue={q.work_title ?? ""} placeholder="Tác phẩm" onChange={(e) => setEdit((s) => ({ ...s, work_title: e.target.value }))}
                        className="rounded-xl bg-muted p-2 text-xs" />
                    </div>
                    <input defaultValue={q.source_text ?? ""} placeholder="Nguồn" onChange={(e) => setEdit((s) => ({ ...s, source_text: e.target.value }))}
                      className="w-full rounded-xl bg-muted p-2 text-xs" />
                  </div>
                ) : (
                  <>
                    <p className="italic text-foreground/90 leading-relaxed">"{q.content}"</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      — {[q.author_name, q.work_title].filter(Boolean).join(" · ") || q.source_text || "Không nguồn"}
                    </p>
                    {q.note && <p className="text-[11px] text-muted-foreground mt-1">Ghi chú: {q.note}</p>}
                  </>
                )}
                <div className="text-[11px] text-muted-foreground mt-2">
                  Người gửi: {q.display_name || "Ẩn danh"} · {new Date(q.created_at).toLocaleString("vi-VN")}
                  {q.reject_reason && <> · Lý do từ chối: {q.reject_reason}</>}
                </div>

                {tab === "pending" && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => approve(q)} className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
                      <Check className="w-3 h-3 mr-1" /> {isEditing ? "Lưu & Duyệt" : "Duyệt"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reject(q)} className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10">
                      <X className="w-3 h-3 mr-1" /> Từ chối
                    </Button>
                    {!isEditing ? (
                      <Button size="sm" variant="ghost" onClick={() => { setEditId(q.id); setEdit({}); }} className="rounded-full">
                        <Edit2 className="w-3 h-3 mr-1" /> Sửa
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => { setEditId(null); setEdit({}); }} className="rounded-full">Huỷ sửa</Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
