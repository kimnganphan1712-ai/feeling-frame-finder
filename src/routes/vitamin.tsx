import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, Plus, Heart, ChevronLeft, ChevronRight, ImageIcon, Lock, Globe2, Loader2, ExternalLink, Sparkles, Quote as QuoteIcon, BookOpen, Film, Music, Mic, Star } from "lucide-react";
import { vitaminStore, type Quote, type HealingWork, type Album } from "@/lib/vitamin-store";
import { SubmitQuoteDialog } from "@/components/vitamin/SubmitQuoteDialog";
import { SaveToAlbumDialog } from "@/components/vitamin/SaveToAlbumDialog";
import { AlbumDetailDialog } from "@/components/vitamin/AlbumDetailDialog";

export const Route = createFileRoute("/vitamin")({
  component: () => (
    <RequireAuth>
      <VitaminPage />
    </RequireAuth>
  ),
});

const TYPE_LABEL: Record<string, string> = {
  film: "Phim", book: "Sách", music: "Nhạc", podcast: "Podcast", playlist: "Playlist", article: "Bài viết", other: "Khác",
};
const WORK_TABS: Array<{ key: string; label: string; icon: typeof Film }> = [
  { key: "all", label: "Tất cả", icon: Sparkles },
  { key: "film", label: "Phim", icon: Film },
  { key: "book", label: "Sách", icon: BookOpen },
  { key: "music", label: "Nhạc", icon: Music },
  { key: "podcast", label: "Podcast", icon: Mic },
  { key: "other", label: "Khác", icon: Star },
];

function VitaminPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [works, setWorks] = useState<HealingWork[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [saveQuoteId, setSaveQuoteId] = useState<string | null>(null);
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null);
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  const [workTab, setWorkTab] = useState<string>("all");

  const reload = async () => {
    setLoading(true);
    const [q, w, a, f] = await Promise.all([
      vitaminStore.listApproved(),
      vitaminStore.listWorks(false),
      vitaminStore.myAlbums(),
      vitaminStore.listFavoriteIds(),
    ]);
    setQuotes(q); setWorks(w); setAlbums(a); setFavIds(f);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const current = quotes[idx];
  const next = () => quotes.length && setIdx((i) => (i + 1) % quotes.length);
  const prev = () => quotes.length && setIdx((i) => (i - 1 + quotes.length) % quotes.length);

  const toggleFav = async () => {
    if (!current) return;
    const on = !favIds.includes(current.id);
    setFavIds((s) => on ? [...s, current.id] : s.filter((x) => x !== current.id));
    await vitaminStore.toggleFavorite(current.id, on);
  };

  return (
    <PageShell>
      <header className="flex items-start justify-between mb-6 animate-[fade-up_0.6s_ease-out]">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Hospital Playlist</p>
          <h1 className="text-3xl font-semibold mt-1">Vitamin cho tâm hồn</h1>
          <p className="text-muted-foreground text-sm mt-1">Một chút câu chữ, một chút ánh sáng, một chút dịu dàng cho tâm hồn.</p>
        </div>
        <Button size="sm" onClick={() => setSubmitOpen(true)} className="rounded-full bg-blush-deep hover:bg-blush-deep/90 text-white">
          <Plus className="w-4 h-4 mr-1" /> Gửi câu nói
        </Button>
      </header>

      {/* Quote spotlight */}
      <section className="animate-[fade-up_0.6s_ease-out]">
        {loading ? (
          <div className="h-[320px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-mint-deep" />
          </div>
        ) : !current ? (
          <div className="rounded-3xl p-10 glass-strong border border-white/60 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-mint/40 flex items-center justify-center">
              <QuoteIcon className="w-6 h-6 text-mint-deep" />
            </div>
            <p className="mt-4 text-foreground/70 italic">Chưa có câu nói nào được duyệt. Hãy là người đầu tiên gửi một câu nói nhé.</p>
            <Button onClick={() => setSubmitOpen(true)} className="mt-4 rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
              <Plus className="w-4 h-4 mr-1" /> Gửi câu nói đầu tiên
            </Button>
          </div>
        ) : (
          <div className="relative min-h-[340px] flex items-center justify-center">
            {[2, 1, 0].map((layer) => {
              const i = (idx + layer) % quotes.length;
              const q = quotes[i];
              return (
                <article key={`${q.id}-${layer}`}
                  className="absolute inset-x-0 mx-auto max-w-md rounded-3xl shadow-card glass-strong border border-white/60 p-8 transition-all duration-500"
                  style={{
                    transform: `translateY(${layer * 14}px) scale(${1 - layer * 0.04})`,
                    opacity: 1 - layer * 0.35, zIndex: 10 - layer,
                  }}>
                  <div className="text-5xl text-mint-deep/40 leading-none">"</div>
                  <p className="mt-2 text-lg md:text-xl leading-relaxed text-foreground/90 italic">{q.content}</p>
                  <p className="mt-6 text-xs text-muted-foreground">
                    — {[q.author_name, q.work_title].filter(Boolean).join(" · ") || q.source_text || q.display_name || "Ẩn danh"}
                  </p>
                </article>
              );
            })}
          </div>
        )}

        {current && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <Button onClick={prev} variant="ghost" size="icon" className="rounded-full"><ChevronLeft className="w-5 h-5" /></Button>
            <Button onClick={() => setSaveQuoteId(current.id)} variant="ghost" size="icon" className="rounded-full" title="Lưu vào album">
              <Bookmark className="w-5 h-5" />
            </Button>
            <Button onClick={toggleFav} variant="ghost" size="icon"
              className={`rounded-full ${favIds.includes(current.id) ? "text-blush-deep bg-blush/40" : ""}`}>
              <Heart className="w-5 h-5" fill={favIds.includes(current.id) ? "currentColor" : "none"} />
            </Button>
            <Button onClick={next} className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">Câu tiếp <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        )}
      </section>

      {/* Albums */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-3 gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Bộ sưu tập</p>
            <h2 className="text-xl font-semibold">Album của bạn</h2>
          </div>
          <Button size="sm" onClick={() => setCreateAlbumOpen(true)}
            className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
            <Plus className="w-4 h-4 mr-1" /> Tạo album
          </Button>
        </div>
        {albums.length === 0 ? (
          <div className="rounded-3xl p-8 bg-gradient-to-br from-mint/20 to-blush/15 border border-white/60 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/70 flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-mint-deep" />
            </div>
            <p className="mt-4 text-sm text-foreground/70 italic">
              Bạn chưa có album nào. Hãy lưu lại những câu nói bạn yêu thích để tạo album đầu tiên.
            </p>
            <Button onClick={() => setCreateAlbumOpen(true)} variant="ghost"
              className="mt-3 rounded-full border border-mint-deep/40 text-mint-deep">
              <Plus className="w-4 h-4 mr-1" /> Tạo album mới
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {albums.map((a) => (
              <button key={a.id} onClick={() => setOpenAlbum(a)}
                className="text-left rounded-3xl overflow-hidden bg-card border border-border shadow-card hover:scale-[1.01] transition-transform">
                <div className="h-28 bg-gradient-to-br from-mint/40 to-blush/30 flex items-center justify-center overflow-hidden">
                  {a.cover_image_url
                    ? <img src={a.cover_image_url} alt="" className="w-full h-full object-cover" />
                    : <ImageIcon className="w-8 h-8 text-mint-deep/60" />}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium truncate">{a.title}</h3>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                      {a.visibility === "private" ? <><Lock className="w-3 h-3" />Riêng</> : <><Globe2 className="w-3 h-3" />Public</>}
                    </span>
                  </div>
                  {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-2">Cập nhật {new Date(a.updated_at).toLocaleDateString("vi-VN")}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Healing works */}
      <section className="mt-12 mb-8">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Gợi ý chữa lành</p>
          <h2 className="text-xl font-semibold">Tác phẩm dịu dàng</h2>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          {WORK_TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setWorkTab(key)}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                workTab === key ? "bg-mint-deep text-white" : "bg-muted text-foreground/70 hover:bg-mint/30"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
        {(() => {
          const filtered = workTab === "all" ? works : works.filter((w) => (w.type || "other") === workTab);
          if (filtered.length === 0) {
            return (
              <div className="rounded-3xl p-8 bg-gradient-to-br from-blush/15 to-mint/15 border border-white/60 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-white/70 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blush-deep" />
                </div>
                <p className="mt-4 text-sm text-foreground/70 italic">
                  Chưa có tác phẩm gợi ý nào lúc này. Hãy quay lại sau nhé.
                </p>
              </div>
            );
          }
          return (
            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map((w) => (
                <article key={w.id} className="rounded-3xl bg-card border border-border p-4 shadow-card flex gap-4 hover:shadow-soft transition-shadow">
                  <div className="w-24 h-24 rounded-2xl bg-mint/30 flex items-center justify-center overflow-hidden shrink-0">
                    {w.thumbnail_url
                      ? <img src={w.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      : <ImageIcon className="w-7 h-7 text-mint-deep" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-mint/40 text-mint-deep">
                        {TYPE_LABEL[w.type] ?? w.type}
                      </span>
                      {w.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                      ))}
                    </div>
                    <h4 className="font-semibold mt-1.5">{w.title}</h4>
                    {w.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{w.description}</p>}
                    {w.external_link && (
                      <a href={w.external_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-mint-deep hover:underline mt-2">
                        Mở <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          );
        })()}
      </section>

      <SubmitQuoteDialog open={submitOpen} onClose={() => setSubmitOpen(false)} onSubmitted={reload} />
      <SaveToAlbumDialog open={!!saveQuoteId} quoteId={saveQuoteId} onClose={() => { setSaveQuoteId(null); reload(); }} />
      <SaveToAlbumDialog open={createAlbumOpen} quoteId={null} onClose={() => { setCreateAlbumOpen(false); reload(); }} />
      <AlbumDetailDialog album={openAlbum} onClose={() => setOpenAlbum(null)} onChanged={reload} />
    </PageShell>
  );
}
