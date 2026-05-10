import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/PageShell";
import { ImageUploader } from "@/components/about/ImageUploader";
import { siteSettingsStore, SITE_KEYS } from "@/lib/site-settings-store";
import { toast } from "sonner";
import { Quote, Sparkles, LogOut, Headphones, Globe2, Stethoscope, BarChart3, Image as ImageIcon, Images } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  component: () => (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  ),
});

function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [savingHero, setSavingHero] = useState(false);

  useEffect(() => {
    siteSettingsStore.get(SITE_KEYS.heroImage).then(setHeroUrl);
  }, []);

  const saveHero = async (url: string | null) => {
    setHeroUrl(url);
    setSavingHero(true);
    const { error } = await siteSettingsStore.set(SITE_KEYS.heroImage, url ?? "", user?.id);
    setSavingHero(false);
    if (error) toast.error("Không lưu được ảnh hero");
    else toast.success(url ? "Đã cập nhật ảnh hero" : "Đã quay về ảnh mặc định");
  };

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  return (
    <PageShell mascot={false}>
      <header className="flex items-start justify-between mb-8 animate-[fade-up_0.6s_ease-out]">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold mt-1">Trang quản trị</h1>
          <p className="text-sm text-muted-foreground mt-1">Đăng nhập với: {user?.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full">
          <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
        </Button>
      </header>

      {/* Hero image management */}
      <section className="mb-6 rounded-3xl bg-card border border-border shadow-card p-6 animate-[fade-up_0.6s_ease-out]">
        <div className="flex items-center gap-2 mb-2 text-scrub">
          <ImageIcon className="w-5 h-5" />
          <h2 className="font-display text-xl text-navy">Ảnh hero trang chủ</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Upload ảnh cinematic cho hero ở trang chủ. Nếu chưa có, hệ thống dùng ảnh mặc định.
          Khuyến nghị: 1920×1080, ảnh hợp lệ về bản quyền.
        </p>
        <ImageUploader
          value={heroUrl}
          onChange={saveHero}
          folder="home-hero"
          label="Tải ảnh hero (1920×1080)"
          aspect="wide"
        />
        {savingHero && <p className="text-xs text-muted-foreground mt-2">Đang lưu…</p>}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[fade-up_0.6s_ease-out]">
        <Link to="/admin/quotes">
          <AdminCard icon={<Quote className="w-6 h-6" />} title="Kiểm duyệt câu nói" description="Duyệt, từ chối, chỉnh sửa câu nói do người dùng gửi vào Vitamin." tone="scrub" />
        </Link>
        <Link to="/admin/healing">
          <AdminCard icon={<Sparkles className="w-6 h-6" />} title="Tác phẩm gợi ý" description="Quản lý phim, sách, podcast, playlist, bài viết chữa lành." tone="warm" />
        </Link>
        <Link to="/admin/podcasts">
          <AdminCard icon={<Headphones className="w-6 h-6" />} title="Tần số chữa lành" description="Đăng tải, chỉnh sửa, ẩn/hiện podcast chữa lành kèm cảm xúc." tone="scrub" />
        </Link>
        <Link to="/admin/community">
          <AdminCard icon={<Globe2 className="w-6 h-6" />} title="Trạm kết nối" description="Cập nhật link Discord cộng đồng cho khu kết nối." tone="warm" />
        </Link>
        <Link to="/admin/project-page">
          <AdminCard icon={<Stethoscope className="w-6 h-6" />} title="Trang Phác đồ chữa lành" description="Chỉnh nội dung, ảnh và thứ tự các phần của trang dự án." tone="scrub" />
        </Link>
        <Link to="/admin/emotion-corners">
          <AdminCard icon={<BarChart3 className="w-6 h-6" />} title="Tương tác Góc cảm xúc" description="Xem người dùng mở góc cảm xúc nào và chọn hành động chữa lành nào nhiều nhất." tone="warm" />
        </Link>
        <Link to="/admin/site-images">
          <AdminCard icon={<Images className="w-6 h-6" />} title="Thư viện ảnh website" description="Upload, sắp xếp, caption ảnh cho hero, gallery, banner từng trang. Có thể đổi ảnh bất cứ lúc nào." tone="scrub" />
        </Link>
      </section>
    </PageShell>
  );
}

function AdminCard({ icon, title, description, tone }: { icon: React.ReactNode; title: string; description: string; tone: "scrub" | "warm" }) {
  const warm = tone === "warm";
  return (
    <div className="rounded-3xl p-6 shadow-card glass border border-border hover:scale-[1.02] hover:shadow-cinematic transition-all duration-200 cursor-pointer h-full">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: warm ? "var(--soft-cream)" : "var(--mist-blue)",
          color: warm ? "var(--blush-deep)" : "var(--primary-blue)",
        }}
      >
        {icon}
      </div>
      <h3 className="font-display text-xl text-navy">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
    </div>
  );
}
