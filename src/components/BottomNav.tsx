import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Heart, Headphones, BookHeart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Trang chủ", icon: Home },
  { to: "/mood", label: "Cảm xúc", icon: Heart },
  { to: "/podcast", label: "Podcast", icon: Headphones },
  { to: "/journal", label: "Nhật ký", icon: BookHeart },
  { to: "/vitamin", label: "Vitamin", icon: Sparkles },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-2 pointer-events-none">
      <div className="glass-strong shadow-soft rounded-3xl mx-auto max-w-lg pointer-events-auto border border-mint/40">
        <ul className="flex items-center justify-around px-2 py-2">
          {items.map(({ to, label, icon: Icon }) => {
            const active = path === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300",
                    active ? "bg-mint/40 text-mint-deep scale-105" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} strokeWidth={active ? 2.4 : 1.8} />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
