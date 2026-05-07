import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { RequireAdmin } from "@/components/RequireAdmin";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/PageShell";
import { Quote, Sparkles, LogOut, Headphones } from "lucide-react";

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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[fade-up_0.6s_ease-out]">
        <Link to="/admin/quotes">
          <AdminCard
            icon={<Quote className="w-6 h-6" />}
            title="Kiểm duyệt câu nói"
            description="Duyệt, từ chối, chỉnh sửa câu nói do người dùng gửi vào Vitamin."
            tint="var(--mint)"
          />
        </Link>
        <Link to="/admin/healing">
          <AdminCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Tác phẩm gợi ý"
            description="Quản lý phim, sách, podcast, playlist, bài viết chữa lành."
            tint="var(--blush)"
          />
        </Link>
        <Link to="/admin/podcasts">
          <AdminCard
            icon={<Headphones className="w-6 h-6" />}
            title="Quản lý Podcast"
            description="Đăng tải, chỉnh sửa, ẩn/hiện podcast chữa lành kèm cảm xúc."
            tint="var(--mint)"
          />
        </Link>
      </section>
    </PageShell>
  );
}

function AdminCard({ icon, title, description, tint }: { icon: React.ReactNode; title: string; description: string; tint: string }) {
  return (
    <div className="rounded-3xl p-6 shadow-card glass border border-white/60 hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: `color-mix(in oklch, ${tint} 50%, white)`, color: "var(--mint-deep)" }}>
        {icon}
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
    </div>
  );
}
