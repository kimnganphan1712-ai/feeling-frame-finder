import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useTodayMood } from "@/lib/today-mood";
import { MoodSticker } from "@/components/MoodSticker";

function EmotionBadge() {
  const { sticker } = useTodayMood();
  if (!sticker) {
    return (
      <div
        className="absolute flex items-center justify-center rounded-full bg-white border-2 border-white shadow-sm text-[10px]"
        style={{ right: "-2px", bottom: "-2px", width: "20px", height: "20px" }}
        title="Chưa chọn cảm xúc"
      >
        <span className="leading-none">🌼</span>
      </div>
    );
  }
  return (
    <div
      className="absolute rounded-full border-2 border-white shadow-sm overflow-hidden"
      style={{ right: "-2px", bottom: "-2px", width: "20px", height: "20px" }}
      title={sticker.label}
    >
      <MoodSticker sticker={sticker} size={16} />
    </div>
  );
}

export function UserMenu() {
  const { user, displayName, avatarUrl, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const name = displayName || user.email?.split("@")[0] || "Bạn";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 bg-white/70 hover:bg-white border border-white/80 transition-colors"
      >
        <div className="relative flex shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <span className="w-7 h-7 rounded-full bg-mint-deep text-white flex items-center justify-center text-xs font-semibold">
              {initial}
            </span>
          )}
          <EmotionBadge />
        </div>
        <span className="text-xs font-medium text-foreground/80 max-w-[100px] truncate">{name}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl glass-strong shadow-soft border border-white/60 p-2 animate-[fade-up_0.2s_ease-out]">
            <div className="px-3 py-2 border-b border-border/50">
              <p className="text-sm font-semibold truncate">{name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
            {role === "admin" && (
              <div className="mt-1 mb-1 pb-1 border-b border-border/50">
                <p className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-widest text-mint-deep/80 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </p>
                <Link to="/admin/dashboard" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start rounded-xl">Bảng điều khiển</Button>
                </Link>
                <Link to="/admin/quotes" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start rounded-xl">Duyệt câu nói</Button>
                </Link>
                <Link to="/admin/healing" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start rounded-xl">Tác phẩm gợi ý</Button>
                </Link>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start mt-1 rounded-xl"
              onClick={async () => {
                setOpen(false);
                await signOut();
                navigate({ to: "/auth" });
              }}
            >
              <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
