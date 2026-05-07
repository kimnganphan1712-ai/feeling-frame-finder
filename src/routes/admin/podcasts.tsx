import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, Loader2, ImageIcon, Save, Eye, EyeOff, Pencil } from "lucide-react";
import {
  podcastStore,
  type Podcast,
  type PodcastStatus,
  PODCAST_CATEGORIES,
  MOOD_TARGETS,
} from "@/lib/podcast-store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/podcasts")({
  component: () => <RequireAdmin><AdminPodcasts /></RequireAdmin>,
});

const STATUS_OPTIONS: { value: PodcastStatus; label: string }[] = [
  { value: "draft", label: "Lưu nháp" },
  { value: "public", label: "Công khai" },
  { value: "private", label: "Riêng tư" },
  { value: "scheduled", label: "Hẹn giờ đăng" },
];

const EMPTY: Partial<Podcast> = {
  title: "",
  short_description: "",
  long_description: "",
  category: "general",
  emotion_tags: [],
  mood_targets: [],
  status: "draft",
  show_on_home: false,
  show_in_today: true,
  allow_favorite: true,
  allow_reactions: true,
  allow_comments: false,
  self_produced: false,
};

function AdminPodcasts() {
  const [items, setItems] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Partial<Podcast> | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  // filters
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMood, setFilterMood] = useState<string>("all");

  const reload = async () => {
    setLoading(true);
    setItems(await podcastStore.listAll());
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => items.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (filterMood !== "all" && !p.mood_targets.includes(filterMood)) return false;
    return true;
  }), [items, filterStatus, filterCategory, filterMood]);

  const startNew = () => { setDraft({ ...EMPTY }); setAudioFile(null); setCoverFile(null); };
  const startEdit = (p: Podcast) => { setDraft({ ...p }); setAudioFile(null); setCoverFile(null); };

  const validate = (d: Partial<Podcast>, audio: File | null, cover: File | null): string | null => {
    if (!d.title?.trim()) return "Vui lòng nhập tiêu đề.";
    if (!d.short_description?.trim()) return "Vui lòng nhập mô tả ngắn.";
    if (!d.audio_url && !audio) return "Vui lòng upload file audio.";
    if (!d.cover_image_url && !cover) return "Vui lòng upload ảnh bìa.";
    if (!d.category) return "Vui lòng chọn danh mục.";
    if (!d.mood_targets?.length) return "Vui lòng chọn ít nhất 1 cảm xúc phù hợp.";
    if (!d.status) return "Vui lòng chọn trạng thái hiển thị.";
    if (!d.self_produced && !d.content_source?.trim()) return "Vui lòng ghi nguồn nội dung hoặc tick 'Nội dung tự sản xuất'.";
    return null;
  };

  const save = async () => {
    if (!draft) return;
    const err = validate(draft, audioFile, coverFile);
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      let audio_url = draft.audio_url ?? null;
      let cover_image_url = draft.cover_image_url ?? null;
      if (audioFile) {
        const url = await podcastStore.uploadFile(audioFile, "audio");
        if (!url) { toast.error("Upload audio thất bại"); setBusy(false); return; }
        audio_url = url;
      }
      if (coverFile) {
        const url = await podcastStore.uploadFile(coverFile, "cover");
        if (!url) { toast.error("Upload ảnh bìa thất bại"); setBusy(false); return; }
        cover_image_url = url;
      }
      const res = await podcastStore.upsert({ ...draft, audio_url, cover_image_url });
      if (res.error) { toast.error(res.error); setBusy(false); return; }
      toast.success(draft.id ? "Đã cập nhật podcast" : "Đã thêm podcast");
      setDraft(null); setAudioFile(null); setCoverFile(null);
      reload();
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Xoá podcast này?")) return;
    await podcastStore.remove(id);
    toast.success("Đã xoá");
    reload();
  };

  const toggleVisibility = async (p: Podcast) => {
    const next: PodcastStatus = p.status === "public" ? "private" : "public";
    await podcastStore.setStatus(p.id, next);
    reload();
  };

  return (
    <PageShell mascot={false}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/admin/dashboard"><Button variant="ghost" size="sm" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-semibold">Quản lý Podcast</h1>
            <p className="text-xs text-muted-foreground">Đăng tải, chỉnh sửa, ẩn/hiện podcast chữa lành.</p>
          </div>
        </div>
        {!draft && (
          <Button onClick={startNew} size="sm" className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
            <Plus className="w-4 h-4 mr-1" /> Thêm podcast
          </Button>
        )}
      </div>

      {!draft && (
        <div className="rounded-3xl glass border border-white/60 p-4 mb-6 flex flex-wrap gap-3">
          <FilterSelect label="Trạng thái" value={filterStatus} onChange={setFilterStatus}
            options={[{ value: "all", label: "Tất cả" }, ...STATUS_OPTIONS]} />
          <FilterSelect label="Danh mục" value={filterCategory} onChange={setFilterCategory}
            options={[{ value: "all", label: "Tất cả" }, ...PODCAST_CATEGORIES]} />
          <FilterSelect label="Cảm xúc" value={filterMood} onChange={setFilterMood}
            options={[{ value: "all", label: "Tất cả" }, ...MOOD_TARGETS]} />
        </div>
      )}

      {draft && (
        <PodcastForm
          draft={draft}
          setDraft={setDraft}
          audioFile={audioFile} setAudioFile={setAudioFile}
          coverFile={coverFile} setCoverFile={setCoverFile}
          onSave={save}
          onCancel={() => { setDraft(null); setAudioFile(null); setCoverFile(null); }}
          busy={busy}
        />
      )}

      {!draft && (loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-mint-deep" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground italic py-12">Chưa có podcast nào.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-3xl bg-card border border-border p-4 shadow-card flex gap-3">
              <div className="w-20 h-20 rounded-2xl bg-mint/30 flex items-center justify-center overflow-hidden shrink-0">
                {p.cover_image_url ? <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-mint-deep" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <h4 className="font-semibold flex-1 truncate">{p.title}</h4>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_description}</p>
                <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-2">
                  <span>{PODCAST_CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category}</span>
                  {p.mood_targets.length > 0 && <span>· Cảm xúc: {p.mood_targets.map((m) => MOOD_TARGETS.find((x) => x.value === m)?.label ?? m).join(", ")}</span>}
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="rounded-full text-xs h-7">
                    <Pencil className="w-3 h-3 mr-1" /> Sửa
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleVisibility(p)} className="rounded-full text-xs h-7">
                    {p.status === "public" ? <><EyeOff className="w-3 h-3 mr-1" />Ẩn</> : <><Eye className="w-3 h-3 mr-1" />Hiện</>}
                  </Button>
                  {p.audio_url && (
                    <a href={p.audio_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="rounded-full text-xs h-7">Xem trước</Button>
                    </a>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)} className="rounded-full text-xs h-7 text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </PageShell>
  );
}

function StatusBadge({ status }: { status: PodcastStatus }) {
  const map: Record<PodcastStatus, { label: string; cls: string }> = {
    draft: { label: "Nháp", cls: "bg-muted text-muted-foreground" },
    public: { label: "Công khai", cls: "bg-mint/40 text-mint-deep" },
    private: { label: "Riêng tư", cls: "bg-blush/40 text-blush-deep" },
    scheduled: { label: "Hẹn giờ", cls: "bg-purple-100 text-purple-700" },
  };
  const m = map[status];
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="text-xs text-muted-foreground flex items-center gap-2">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl bg-muted px-2 py-1 text-sm">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-4 space-y-3">
      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{title}</h4>
      {children}
    </div>
  );
}

function PodcastForm({
  draft, setDraft, audioFile, setAudioFile, coverFile, setCoverFile, onSave, onCancel, busy,
}: {
  draft: Partial<Podcast>;
  setDraft: (d: Partial<Podcast>) => void;
  audioFile: File | null; setAudioFile: (f: File | null) => void;
  coverFile: File | null; setCoverFile: (f: File | null) => void;
  onSave: () => void; onCancel: () => void; busy: boolean;
}) {
  const toggleMood = (v: string) => {
    const cur = new Set(draft.mood_targets ?? []);
    if (cur.has(v)) cur.delete(v); else cur.add(v);
    setDraft({ ...draft, mood_targets: Array.from(cur) });
  };

  return (
    <div className="rounded-3xl bg-card border border-border p-5 mb-6 shadow-card space-y-4">
      <h3 className="font-semibold text-lg">{draft.id ? "Chỉnh sửa podcast" : "Podcast mới"}</h3>

      <Section title="Thông tin cơ bản">
        <input value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Tiêu đề podcast *" className="w-full rounded-xl bg-background border border-border p-2 text-sm" />
        <textarea value={draft.short_description ?? ""} onChange={(e) => setDraft({ ...draft, short_description: e.target.value })}
          rows={2} placeholder="Mô tả ngắn *" className="w-full rounded-xl bg-background border border-border p-2 text-sm resize-none" />
        <textarea value={draft.long_description ?? ""} onChange={(e) => setDraft({ ...draft, long_description: e.target.value })}
          rows={4} placeholder="Mô tả chi tiết" className="w-full rounded-xl bg-background border border-border p-2 text-sm resize-none" />
        <div className="grid grid-cols-2 gap-2">
          <input value={draft.host ?? ""} onChange={(e) => setDraft({ ...draft, host: e.target.value })}
            placeholder="Tác giả / Host" className="rounded-xl bg-background border border-border p-2 text-sm" />
          <input type="number" value={draft.duration_seconds ?? ""} onChange={(e) => setDraft({ ...draft, duration_seconds: e.target.value ? Number(e.target.value) : null })}
            placeholder="Thời lượng (giây)" className="rounded-xl bg-background border border-border p-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">Ngày đăng
            <input type="datetime-local" value={draft.published_at ? draft.published_at.slice(0, 16) : ""}
              onChange={(e) => setDraft({ ...draft, published_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full mt-1 rounded-xl bg-background border border-border p-2 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input value={draft.series ?? ""} onChange={(e) => setDraft({ ...draft, series: e.target.value })}
              placeholder="Series" className="rounded-xl bg-background border border-border p-2 text-sm" />
            <input type="number" value={draft.episode_number ?? ""} onChange={(e) => setDraft({ ...draft, episode_number: e.target.value ? Number(e.target.value) : null })}
              placeholder="Tập số" className="rounded-xl bg-background border border-border p-2 text-sm" />
          </div>
        </div>
      </Section>

      <Section title="File & hình ảnh">
        <label className="block text-xs text-muted-foreground">File audio *
          <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} className="block mt-1 text-xs" />
          {draft.audio_url && !audioFile && <p className="mt-1 text-[10px] text-mint-deep">Đã có file: {draft.audio_url.split("/").pop()}</p>}
        </label>
        <label className="block text-xs text-muted-foreground">Ảnh bìa *
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} className="block mt-1 text-xs" />
          {draft.cover_image_url && !coverFile && <img src={draft.cover_image_url} alt="" className="mt-2 w-24 h-24 object-cover rounded-xl" />}
        </label>
      </Section>

      <Section title="Phân loại & cảm xúc">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">Danh mục *
            <select value={draft.category ?? "general"} onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="w-full mt-1 rounded-xl bg-background border border-border p-2 text-sm">
              {PODCAST_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          <input value={(draft.emotion_tags ?? []).join(", ")} onChange={(e) => setDraft({ ...draft, emotion_tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
            placeholder="Tag cảm xúc (vd: thở chậm, bình yên)" className="rounded-xl bg-background border border-border p-2 text-sm self-end" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Phù hợp với cảm xúc * (chọn ≥1)</p>
          <div className="flex flex-wrap gap-2">
            {MOOD_TARGETS.map((m) => {
              const on = (draft.mood_targets ?? []).includes(m.value);
              return (
                <button key={m.value} type="button" onClick={() => toggleMood(m.value)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${on ? "bg-mint-deep text-white border-mint-deep" : "bg-background border-border hover:bg-mint/20"}`}>
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
        <textarea value={draft.healing_message ?? ""} onChange={(e) => setDraft({ ...draft, healing_message: e.target.value })}
          rows={2} placeholder="Lời nhắn chữa lành kèm theo" className="w-full rounded-xl bg-background border border-border p-2 text-sm resize-none" />
        <textarea value={draft.transcript ?? ""} onChange={(e) => setDraft({ ...draft, transcript: e.target.value })}
          rows={3} placeholder="Transcript (nếu có)" className="w-full rounded-xl bg-background border border-border p-2 text-sm resize-none" />
      </Section>

      <Section title="Bản quyền / Nguồn">
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={draft.self_produced ?? false} onChange={(e) => setDraft({ ...draft, self_produced: e.target.checked })} className="accent-mint-deep" />
          Nội dung tự sản xuất
        </label>
        <input value={draft.content_source ?? ""} onChange={(e) => setDraft({ ...draft, content_source: e.target.value })}
          placeholder={draft.self_produced ? "Nguồn nội dung (tuỳ chọn)" : "Nguồn nội dung *"} className="w-full rounded-xl bg-background border border-border p-2 text-sm" />
        <input value={draft.music_source ?? ""} onChange={(e) => setDraft({ ...draft, music_source: e.target.value })}
          placeholder="Nguồn nhạc nền" className="w-full rounded-xl bg-background border border-border p-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input value={draft.original_author ?? ""} onChange={(e) => setDraft({ ...draft, original_author: e.target.value })}
            placeholder="Tác giả gốc" className="rounded-xl bg-background border border-border p-2 text-sm" />
          <input value={draft.reference_link ?? ""} onChange={(e) => setDraft({ ...draft, reference_link: e.target.value })}
            placeholder="Link tham khảo" className="rounded-xl bg-background border border-border p-2 text-sm" />
        </div>
      </Section>

      <Section title="Cài đặt hiển thị">
        <label className="text-xs text-muted-foreground block">Trạng thái *
          <select value={draft.status ?? "draft"} onChange={(e) => setDraft({ ...draft, status: e.target.value as PodcastStatus })}
            className="w-full mt-1 rounded-xl bg-background border border-border p-2 text-sm">
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <Toggle label="Hiển thị trên trang chủ" checked={!!draft.show_on_home} onChange={(v) => setDraft({ ...draft, show_on_home: v })} />
          <Toggle label="Hiện trong gợi ý hôm nay" checked={!!draft.show_in_today} onChange={(v) => setDraft({ ...draft, show_in_today: v })} />
          <Toggle label="Cho phép lưu yêu thích" checked={!!draft.allow_favorite} onChange={(v) => setDraft({ ...draft, allow_favorite: v })} />
          <Toggle label="Cho phép thả cảm xúc" checked={!!draft.allow_reactions} onChange={(v) => setDraft({ ...draft, allow_reactions: v })} />
          <Toggle label="Cho phép bình luận" checked={!!draft.allow_comments} onChange={(v) => setDraft({ ...draft, allow_comments: v })} />
        </div>
      </Section>

      <div className="flex gap-2 pt-2">
        <Button onClick={onSave} disabled={busy} className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
          {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Lưu podcast
        </Button>
        <Button onClick={onCancel} variant="ghost" className="rounded-full">Huỷ</Button>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-mint-deep" />
      {label}
    </label>
  );
}
