import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookHeart, Headphones, Sparkles, Globe2, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/about", label: "Phác đồ", icon: Stethoscope, full: "Phác đồ chữa lành" },
  { to: "/", label: "Trạm", icon: Home, full: "Trạm cảm xúc" },
  { to: "/journal", label: "Hồ sơ", icon: BookHeart, full: "Hồ sơ cảm xúc" },
  { to: "/podcast", label: "Tần số", icon: Headphones, full: "Tần số chữa lành" },
  { to: "/vitamin", label: "Dưỡng chất", icon: Sparkles, full: "Dưỡng chất tinh thần" },
  { to: "/mood-board", label: "Kết nối", icon: Globe2, full: "Không gian kết nối" },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-2 pointer-events-none">
      <div className="glass-strong shadow-soft rounded-3xl mx-auto max-w-2xl pointer-events-auto border border-mint/40">
        <ul className="flex items-center justify-around px-1 py-2 overflow-x-auto no-scrollbar gap-1">
          {items.map(({ to, label, icon: Icon, full }) => {
            const active = path === to;
            return (
              <li key={to} className="shrink-0">
                <Link
                  to={to}
                  title={full}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl transition-all duration-300 min-w-[52px]",
                    active ? "bg-mint/40 text-mint-deep scale-105" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} strokeWidth={active ? 2.4 : 1.8} />
                  <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
