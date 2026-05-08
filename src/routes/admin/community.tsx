import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, MessageCircle, Loader2 } from "lucide-react";
import { siteSettingsStore, SITE_KEYS } from "@/lib/site-settings-store";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/community")({
  component: () => (
    <RequireAdmin>
      <AdminCommunity />
    </RequireAdmin>
  ),
});

function AdminCommunity() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    siteSettingsStore.get(SITE_KEYS.discordInvite).then((v) => {
      setUrl(v ?? "");
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const trimmed = url.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      toast.error("Link Discord phải bắt đầu bằng http(s)://");
      setSaving(false);
      return;
    }
    const res = await siteSettingsStore.set(SITE_KEYS.discordInvite, trimmed, user?.id);
    setSaving(false);
    if (res.error) toast.error(res.error);
    else toast.success("Đã lưu link Discord");
  };

  return (
    <PageShell mascot={false}>
      <Link to="/admin/dashboard">
        <Button variant="ghost" size="sm" className="rounded-full mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Trở về
        </Button>
      </Link>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Quản trị</p>
        <h1 className="text-2xl font-semibold mt-1">Không gian kết nối</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cập nhật link Discord cộng đồng. Để trống nếu chưa sẵn sàng.
        </p>
      </header>

      <section className="rounded-3xl glass border border-white/60 p-6 shadow-card max-w-xl">
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <MessageCircle className="w-4 h-4 text-mint-deep" /> Link Discord
        </label>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-mint-deep" />
        ) : (
          <>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://discord.gg/..."
              className="rounded-xl"
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={save} disabled={saving} className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
                {saving ? "Đang lưu…" : "Lưu thay đổi"}
              </Button>
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}
