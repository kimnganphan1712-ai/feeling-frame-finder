import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireAdmin } from "@/components/RequireAdmin";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/PageShell";
import { FileImage, Headphones, Quote, Sparkles, LogOut } from "lucide-react";

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
    <PageShell>
      <header className="flex items-start justify-between mb-8 animate-[fade-up_0.6s_ease-out]">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold mt-1">Trang quản trị</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Đăng nhập với: {user?.email}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full">
          <LogOut className="w-4 h-4 mr-2" />
          Đăng xuất
        </Button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[fade-up_0.6s_ease-out]">
        <AdminCard
          icon={<FileImage className="w-6 h-6" />}
          title="Quản lý Postcard"
          description="Thêm, sửa, xóa và upload hình ảnh cho Postcard."
          tint="var(--mint)"
        />
        <AdminCard
          icon={<Headphones className="w-6 h-6" />}
          title="Quản lý Podcast"
          description="Quản lý danh sách các tập podcast và tiến trình."
          tint="var(--blush)"
        />
        <AdminCard
          icon={<Quote className="w-6 h-6" />}
          title="Quản lý Câu nói hằng ngày"
          description="Thêm, sửa, xóa danh sách châm ngôn hiển thị mỗi ngày."
          tint="var(--mint)"
        />
        <AdminCard
          icon={<Sparkles className="w-6 h-6" />}
          title="Quản lý Nội dung gợi ý"
          description="Cập nhật các nội dung gợi ý, bài viết hướng dẫn."
          tint="var(--blush)"
        />
      </section>
    </PageShell>
  );
}

function AdminCard({
  icon,
  title,
  description,
  tint,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tint: string;
}) {
  return (
    <div className="rounded-3xl p-6 shadow-card glass border border-white/60 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: `color-mix(in oklch, ${tint} 50%, white)`, color: "var(--mint-deep)" }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
