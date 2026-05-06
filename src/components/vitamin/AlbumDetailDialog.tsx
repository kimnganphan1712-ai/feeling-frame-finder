import { useEffect, useState } from "react";
import { X, Lock, Globe2, Trash2, ImageIcon, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vitaminStore, type Album, type Quote } from "@/lib/vitamin-store";

export function AlbumDetailDialog({ album, onClose, onChanged, readOnly = false }: { album: Album | null; onClose: () => void; onChanged: () => void; readOnly?: boolean }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [vis, setVis] = useState<"public" | "private">("private");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!album) return;
    setLoading(true);
    setTitle(album.title); setDesc(album.description ?? ""); setVis(album.visibility); setCoverFile(null);
    vitaminStore.listAlbumQuotes(album.id).then((q) => { setQuotes(q); setLoading(false); });
  }, [album]);

  if (!album) return null;

  const save = async () => {
    setBusy(true);
    let coverUrl: string | undefined;
    if (coverFile) {
      const url = await vitaminStore.uploadImage(coverFile, "album");
      if (url) coverUrl = url;
    }
    await vitaminStore.updateAlbum(album.id, {
      title, description: desc, visibility: vis,
      ...(coverUrl ? { cover_image_url: coverUrl } : {}),
    });
    setBusy(false); setEditing(false); onChanged();
  };

  const removeQuote = async (qid: string) => {
    await vitaminStore.removeQuoteFromAlbum(album.id, qid);
    setQuotes((s) => s.filter((q) => q.id !== qid));
  };

  const deleteAlbum = async () => {
    if (!confirm("Xoá album này? Câu nói trong album sẽ bị bỏ khỏi album.")) return;
    await vitaminStore.deleteAlbum(album.id);
    onChanged(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-soft max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4 items-start">
          <div className="w-24 h-24 rounded-2xl bg-mint/40 flex items-center justify-center overflow-hidden shrink-0">
            {album.cover_image_url
              ? <img src={album.cover_image_url} alt="" className="w-full h-full object-cover" />
              : <ImageIcon className="w-7 h-7 text-mint-deep" />}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-2">
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl bg-muted p-2 text-sm" />
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Mô tả ngắn"
                  className="w-full rounded-xl bg-muted p-2 text-sm resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => setVis("private")}
                    className={`flex-1 rounded-xl py-1.5 text-xs flex items-center justify-center gap-1 ${vis === "private" ? "bg-mint-deep text-white" : "bg-muted"}`}>
                    <Lock className="w-3 h-3" /> Riêng tư
                  </button>
                  <button onClick={() => setVis("public")}
                    className={`flex-1 rounded-xl py-1.5 text-xs flex items-center justify-center gap-1 ${vis === "public" ? "bg-mint-deep text-white" : "bg-muted"}`}>
                    <Globe2 className="w-3 h-3" /> Công khai
                  </button>
                </div>
                <label className="block text-[11px] text-muted-foreground">Đổi ảnh bìa
                  <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} className="block mt-1 text-xs" />
                </label>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold">{album.title}</h3>
                {album.description && <p className="text-sm text-muted-foreground mt-1">{album.description}</p>}
                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                  {album.visibility === "private" ? <><Lock className="w-3 h-3" /> Riêng tư</> : <><Globe2 className="w-3 h-3" /> Công khai</>}
                  <span>·</span>
                  <span>{quotes.length} câu nói</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {editing ? (
            <>
              <Button onClick={save} disabled={busy} size="sm" className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
                {busy ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />} Lưu
              </Button>
              <Button onClick={() => setEditing(false)} variant="ghost" size="sm" className="rounded-full">Huỷ</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="rounded-full">Chỉnh sửa</Button>
              <Button onClick={deleteAlbum} variant="ghost" size="sm" className="rounded-full text-destructive hover:bg-destructive/10">
                <Trash2 className="w-3 h-3 mr-1" /> Xoá album
              </Button>
            </>
          )}
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <h4 className="text-sm font-medium mb-3">Câu nói trong album</h4>
          {loading ? (
            <div className="py-6 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-mint-deep" /></div>
          ) : quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Album đang trống.</p>
          ) : (
            <div className="space-y-2">
              {quotes.map((q) => (
                <div key={q.id} className="rounded-2xl bg-muted/50 p-3 text-sm flex gap-2 items-start">
                  <div className="flex-1">
                    <p className="italic text-foreground/90">"{q.content}"</p>
                    <p className="text-[11px] text-muted-foreground mt-1">— {q.author_name || q.work_title || q.source_text || "Ẩn danh"}</p>
                  </div>
                  <button onClick={() => removeQuote(q.id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
