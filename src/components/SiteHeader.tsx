import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Stethoscope, Pill, Headphones, Sparkles, Globe2, BookHeart } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { to: "/about", label: "Phác đồ chữa lành", short: "Phác đồ", icon: Stethoscope },
  { to: "/prescription", label: "Đơn thuốc tinh thần", short: "Đơn thuốc", icon: Pill },
  { to: "/podcast", label: "Tần số chữa lành", short: "Tần số", icon: Headphones },
  { to: "/vitamin", label: "Vitamin cho tâm hồn", short: "Vitamin", icon: Sparkles },
  { to: "/mood-board", label: "Trạm kết nối", short: "Kết nối", icon: Globe2 },
  { to: "/journal", label: "Hồ sơ cảm xúc", short: "Hồ sơ", icon: BookHeart },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-mint/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link to="/" className="font-display text-base sm:text-lg font-semibold text-mint-deep whitespace-nowrap">
          Hospital Playlist
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label }) => {
            const active = path === to || (to !== "/" && path.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-colors",
                  active
                    ? "bg-mint/40 text-mint-deep font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-mint/20",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          aria-label={open ? "Đóng menu" : "Mở menu"}
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-mint/30 text-mint-deep"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="lg:hidden border-t border-mint/30 bg-background/95 backdrop-blur-md">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = path === to || (to !== "/" && path.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-2xl text-sm transition-colors",
                    active
                      ? "bg-mint/40 text-mint-deep font-medium"
                      : "text-foreground hover:bg-mint/20",
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
