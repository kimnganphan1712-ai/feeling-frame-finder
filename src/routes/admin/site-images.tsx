import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  siteImagesStore,
  IMAGE_SLOTS,
  SLOT_LABELS,
  type SiteImage,
} from "@/lib/site-images-store";
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Star, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/site-images")({
  component: () => (
    <RequireAdmin>
      <SiteImagesAdmin />
    </RequireAdmin>
  ),
});

const SLOT_OPTIONS = Object.values(IMAGE_SLOTS);

function SiteImagesAdmin() {
  const [activeSlot, setActiveSlot] = useState<string>(IMAGE_SLOTS.aboutGallery);
  const [items, setItems] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    setLoading(true);
    const data = await siteImagesStore.listBySlot(activeSlot);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlot]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ảnh quá lớn (tối đa 8MB)");
      return;
    }
    try {
      setUploading(true);
      const url = await siteImagesStore.uploadFile(file, activeSlot);
      const nextOrder = (items[items.length - 1]?.sort_order ?? -1) + 1;
      await siteImagesStore.create({ slot: activeSlot, url, sort_order: nextOrder });
      toast.success("Đã thêm ảnh");
      await reload();
    } catch (e) {
      console.error(e);
      toast.error("Không tải được ảnh");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= items.length) return;
    const a = items[idx];
    const b = items[swap];
    await siteImagesStore.reorder([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ]);
    await reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Xoá ảnh này?")) return;
    await siteImagesStore.remove(id);
    toast.success("Đã xoá");
    await reload();
  };

  const toggleFeatured = async (img: SiteImage) => {
    await siteImagesStore.update(img.id, { is_featured: !img.is_featured });
    await reload();
  };

  const updateMeta = async (id: string, patch: Partial<SiteImage>) => {
    await siteImagesStore.update(id, patch);
  };

  const slotMeta = SLOT_LABELS[activeSlot];

  return (
    <PageShell mascot={false}>
      <header className="flex items-center justify-between mb-6 animate-[fade-up_0.6s_ease-out]">
        <div>
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="sm" className="rounded-full -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          </Link>
          <h1 className="font-display text-2xl md:text-3xl mt-2 text-navy">Thư viện ảnh website</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload, sắp xếp và caption ảnh cho từng vị trí trên website.
          </p>
        </div>
      </header>

      <section className="rounded-3xl bg-card border border-border shadow-card p-5 sm:p-6 mb-6">
        <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <Label className="text-xs uppercase tracking-widest text-mint-deep">Vị trí ảnh</Label>
            <Select value={activeSlot} onValueChange={setActiveSlot}>
              <SelectTrigger className="mt-1.5 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLOT_OPTIONS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {SLOT_LABELS[slot]?.label ?? slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {slotMeta && (
              <p className="text-xs text-muted-foreground mt-2">{slotMeta.description}</p>
            )}
          </div>
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-full bg-scrub-deep hover:bg-scrub-deep/90 text-white"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload ảnh mới
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      </section>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-muted/30 p-10 text-center text-muted-foreground">
          <ImageIcon className="w-10 h-10 mx-auto opacity-50 mb-3" />
          <p>Chưa có ảnh nào ở vị trí này. Upload ảnh đầu tiên ở trên.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((img, idx) => (
            <li
              key={img.id}
              className="rounded-3xl bg-card border border-border shadow-card p-3 flex flex-col gap-3"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-border">
                <img src={img.url} alt={img.alt ?? ""} className="w-full h-full object-cover" />
                {img.is_featured && (
                  <span className="absolute top-2 left-2 text-[10px] uppercase tracking-widest bg-warm text-navy px-2 py-1 rounded-full font-semibold">
                    Nổi bật
                  </span>
                )}
                <span className="absolute top-2 right-2 text-[10px] bg-navy/70 text-white px-2 py-1 rounded-full">
                  #{idx + 1}
                </span>
              </div>

              <div className="space-y-2">
                <Input
                  defaultValue={img.alt ?? ""}
                  placeholder="Alt text (mô tả ảnh)"
                  onBlur={(e) => updateMeta(img.id, { alt: e.target.value || null })}
                  className="rounded-xl"
                />
                <Textarea
                  defaultValue={img.caption ?? ""}
                  placeholder="Caption hiển thị (tuỳ chọn)"
                  rows={2}
                  onBlur={(e) => updateMeta(img.id, { caption: e.target.value || null })}
                  className="rounded-xl resize-none"
                />
                <Input
                  defaultValue={img.tag ?? ""}
                  placeholder="Tag / phân loại (vd: founder, gallery)"
                  onBlur={(e) => updateMeta(img.id, { tag: e.target.value || null })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => move(img.id, -1)} disabled={idx === 0}>
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => move(img.id, 1)} disabled={idx === items.length - 1}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={`rounded-full ${img.is_featured ? "border-warm text-warm" : ""}`}
                  onClick={() => toggleFeatured(img)}
                >
                  <Star className="w-3.5 h-3.5 mr-1" />
                  {img.is_featured ? "Bỏ nổi bật" : "Nổi bật"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-destructive border-destructive/40 ml-auto"
                  onClick={() => remove(img.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
