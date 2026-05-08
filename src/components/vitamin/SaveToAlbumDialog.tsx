import { useEffect, useState } from "react";
import { X, Plus, Lock, Globe2, Loader2, Check, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vitaminStore, type Album } from "@/lib/vitamin-store";

export function SaveToAlbumDialog({ open, quoteId, onClose }: { open: boolean; quoteId: string | null; onClose: () => void }) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [vis, setVis] = useState<"public" | "private">("private");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [savedTo, setSavedTo] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    vitaminStore.myAlbums().then((a) => { setAlbums(a); setLoading(false); });
    setSavedTo([]);
    setCreating(!quoteId);
  }, [open, quoteId]);

  if (!open) return null;

  const addTo = async (id: string) => {
    if (!quoteId) return;
    setBusyId(id);
    await vitaminStore.addQuoteToAlbum(id, quoteId);
    setSavedTo((s) => [...s, id]);
    setBusyId(null);
  };

  const create = async () => {
    setBusyId("__new");
    let coverUrl: string | null = null;
    if (coverFile) coverUrl = await vitaminStore.uploadImage(coverFile, "album");
    const res = await vitaminStore.createAlbum({ title, visibility: vis, cover_image_url: coverUrl });
    if (res.id) {
      if (quoteId) await vitaminStore.addQuoteToAlbum(res.id, quoteId);
      const a = await vitaminStore.myAlbums();
      setAlbums(a);
      if (quoteId) setSavedTo((s) => [...s, res.id!]);
      setTitle(""); setCoverFile(null); setCreating(false);
      if (!quoteId) onClose();
    }
    setBusyId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-soft max-w-md w-full p-6 relative max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-semibold">{quoteId ? "Lưu vào album" : "Tạo album mới"}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {quoteId ? "Chọn album sẵn có hoặc tạo album mới." : "Đặt tên, chọn chế độ và ảnh bìa cho album của bạn."}
        </p>

        {quoteId && (loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-mint-deep" /></div>
        ) : (
          <div className="mt-4 space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {albums.length === 0 && !creating && (
              <p className="text-sm text-muted-foreground italic text-center py-4">Bạn chưa có album nào.</p>
            )}
            {albums.map((a) => {
              const saved = savedTo.includes(a.id);
              return (
                <button key={a.id} onClick={() => !saved && addTo(a.id)} disabled={saved || busyId === a.id}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border hover:bg-mint/20 transition-colors text-left">
                  <div className="w-10 h-10 rounded-xl bg-mint/40 flex items-center justify-center overflow-hidden">
                    {a.cover_image_url
                      ? <img src={a.cover_image_url} alt="" className="w-full h-full object-cover" />
                      : <ImageIcon className="w-4 h-4 text-mint-deep" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      {a.visibility === "private" ? <><Lock className="w-3 h-3" /> Riêng tư</> : <><Globe2 className="w-3 h-3" /> Công khai</>}
                    </div>
                  </div>
                  {saved ? <Check className="w-4 h-4 text-mint-deep" /> : busyId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                </button>
              );
            })}
          </div>
        ))}

        {creating ? (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên album"
              className="w-full rounded-2xl bg-muted p-3 text-sm outline-none focus:ring-2 focus:ring-mint-deep/40" />
            <div className="flex gap-2">
              <button onClick={() => setVis("private")}
                className={`flex-1 rounded-2xl py-2 text-sm flex items-center justify-center gap-2 ${vis === "private" ? "bg-mint-deep text-white" : "bg-muted text-foreground/70"}`}>
                <Lock className="w-3 h-3" /> Riêng tư
              </button>
              <button onClick={() => setVis("public")}
                className={`flex-1 rounded-2xl py-2 text-sm flex items-center justify-center gap-2 ${vis === "public" ? "bg-mint-deep text-white" : "bg-muted text-foreground/70"}`}>
                <Globe2 className="w-3 h-3" /> Công khai
              </button>
            </div>
            <label className="block text-xs text-muted-foreground">Ảnh bìa (tuỳ chọn)
              <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="block mt-1 text-xs" />
            </label>
            <div className="flex gap-2">
              <Button onClick={create} disabled={!title.trim() || busyId === "__new"} className="flex-1 rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
                {busyId === "__new" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo album"}
              </Button>
              <Button variant="ghost" onClick={() => setCreating(false)} className="rounded-full">Huỷ</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setCreating(true)} variant="ghost" className="mt-4 w-full rounded-full border border-dashed border-mint-deep/40 text-mint-deep">
            <Plus className="w-4 h-4 mr-1" /> Tạo album mới
          </Button>
        )}
      </div>
    </div>
  );
}
