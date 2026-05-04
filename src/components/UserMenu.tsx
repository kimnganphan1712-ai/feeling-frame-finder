import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

export function UserMenu() {
  const { user, displayName, avatarUrl, signOut } = useAuth();
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
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-mint-deep text-white flex items-center justify-center text-xs font-semibold">
            {initial}
          </span>
        )}
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
