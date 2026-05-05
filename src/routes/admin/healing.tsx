import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, Loader2, ImageIcon, Save } from "lucide-react";
import { vitaminStore, type HealingWork, type WorkType } from "@/lib/vitamin-store";

export const Route = createFileRoute("/admin/healing")({
  component: () => <RequireAdmin><AdminHealing /></RequireAdmin>,
});

const TYPES: { value: WorkType; label: string }[] = [
  { value: "film", label: "Phim" },
  { value: "book", label: "Sách" },
  { value: "podcast", label: "Podcast" },
  { value: "playlist", label: "Playlist" },
  { value: "article", label: "Bài viết" },
  { value: "other", label: "Khác" },
];

function AdminHealing() {
  const [items, setItems] = useState<HealingWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Partial<HealingWork> | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    setItems(await vitaminStore.listWorks(true));
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const startNew = () => {
    setDraft({ title: "", description: "", type: "podcast", tags: [], is_published: true });
    setCoverFile(null);
  };

  const save = async () => {
    if (!draft?.title?.trim()) return;
    setBusy(true);
    let thumb = draft.thumbnail_url;
    if (coverFile) {
      const url = await vitaminStore.uploadImage(coverFile, "healing");
      if (url) thumb = url;
    }
    await vitaminStore.upsertWork({ ...draft, thumbnail_url: thumb });
    setBusy(false);
    setDraft(null); setCoverFile(null);
    reload();
  };

  const del = async (id: string) => {
    if (!confirm("Xoá tác phẩm này?")) return;
    await vitaminStore.deleteWork(id);
    reload();
  };

  return (
    <PageShell mascot={false}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/dashboard"><Button variant="ghost" size="sm" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-semibold">Tác phẩm gợi ý</h1>
            <p className="text-xs text-muted-foreground">Quản lý phim, sách, podcast, playlist, bài viết chữa lành.</p>
          </div>
        </div>
        {!draft && (
          <Button onClick={startNew} size="sm" className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
            <Plus className="w-4 h-4 mr-1" /> Thêm
          </Button>
        )}
      </div>

      {draft && (
        <div className="rounded-3xl bg-card border border-border p-5 mb-6 shadow-card space-y-3">
          <h3 className="font-semibold">{draft.id ? "Chỉnh sửa" : "Tác phẩm mới"}</h3>
          <input value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Tiêu đề"
            className="w-full rounded-xl bg-muted p-2 text-sm" />
          <textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} placeholder="Mô tả ngắn"
            className="w-full rounded-xl bg-muted p-2 text-sm resize-none" />
          <div className="grid grid-cols-2 gap-2">
            <select value={draft.type ?? "article"} onChange={(e) => setDraft({ ...draft, type: e.target.value as WorkType })}
              className="rounded-xl bg-muted p-2 text-sm">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input value={draft.external_link ?? ""} onChange={(e) => setDraft({ ...draft, external_link: e.target.value })} placeholder="Link (tuỳ chọn)"
              className="rounded-xl bg-muted p-2 text-sm" />
          </div>
          <input value={(draft.tags ?? []).join(", ")} onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
            placeholder="Tag (cách nhau bằng dấu phẩy)" className="w-full rounded-xl bg-muted p-2 text-sm" />
          <label className="block text-xs text-muted-foreground">Ảnh bìa
            <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} className="block mt-1 text-xs" />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={draft.is_published ?? true} onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })} className="accent-mint-deep" />
            Hiển thị công khai
          </label>
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy} size="sm" className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
              {busy ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />} Lưu
            </Button>
            <Button onClick={() => { setDraft(null); setCoverFile(null); }} variant="ghost" size="sm" className="rounded-full">Huỷ</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-mint-deep" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground italic py-12">Chưa có tác phẩm nào.</p>
      ) : (
        <div className="space-y-3">
          {items.map((w) => (
            <div key={w.id} className="rounded-3xl bg-card border border-border p-4 shadow-card flex gap-3">
              <div className="w-20 h-20 rounded-2xl bg-mint/30 flex items-center justify-center overflow-hidden shrink-0">
                {w.thumbnail_url ? <img src={w.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-mint-deep" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <h4 className="font-semibold flex-1 truncate">{w.title}</h4>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-mint/40 text-mint-deep">{w.type}</span>
                </div>
                {w.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{w.description}</p>}
                <div className="text-[10px] text-muted-foreground mt-1">
                  {w.is_published ? "Công khai" : "Ẩn"} · {w.tags.join(", ")}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => { setDraft(w); setCoverFile(null); }} className="rounded-full text-xs h-7">Sửa</Button>
                  <Button size="sm" variant="ghost" onClick={() => del(w.id)} className="rounded-full text-xs h-7 text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
