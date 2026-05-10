import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Globe2, ImageIcon, Loader2, User } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { vitaminStore, type Album } from "@/lib/vitamin-store";
import { AlbumDetailDialog } from "@/components/vitamin/AlbumDetailDialog";

export const Route = createFileRoute("/u/$userId")({
  head: () => ({
    meta: [
      { title: "Hồ sơ — Hospital Playlist" },
      { name: "description", content: "Album công khai của thành viên Hospital Playlist." },
    ],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<{ id: string; display_name: string | null; avatar_url: string | null } | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Album | null>(null);

  const reload = () => {
    setLoading(true);
    Promise.all([vitaminStore.getPublicProfile(userId), vitaminStore.publicAlbumsOf(userId)])
      .then(([p, a]) => { setProfile(p); setAlbums(a); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [userId]);

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/vitamin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Về Vitamin
        </Link>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-mint-deep" /></div>
        ) : !profile ? (
          <div className="text-center py-20 text-muted-foreground">Không tìm thấy hồ sơ này.</div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full bg-mint/40 flex items-center justify-center overflow-hidden">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <User className="w-8 h-8 text-mint-deep" />}
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{profile.display_name || "Một tâm hồn ẩn danh"}</h1>
                <p className="text-sm text-muted-foreground mt-1">{albums.length} album công khai</p>
              </div>
            </div>

            {albums.length === 0 ? (
              <div className="rounded-3xl bg-muted/50 p-10 text-center text-sm text-muted-foreground italic">
                Người này chưa chia sẻ album nào.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {albums.map((a) => (
                  <button key={a.id} onClick={() => setOpen(a)}
                    className="group text-left rounded-3xl overflow-hidden bg-card shadow-soft hover:shadow-lg transition-all">
                    <div className="aspect-square bg-mint/30 flex items-center justify-center overflow-hidden">
                      {a.cover_image_url
                        ? <img src={a.cover_image_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        : <ImageIcon className="w-8 h-8 text-mint-deep" />}
                    </div>
                    <div className="p-3">
                      <div className="font-medium truncate">{a.title}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Globe2 className="w-3 h-3" /> Công khai
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AlbumDetailDialog album={open} onClose={() => setOpen(null)} onChanged={reload} readOnly />
    </PageShell>
  );
}
