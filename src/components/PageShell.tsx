import { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { Mascot, type MascotVariant } from "./Mascot";
import { cn } from "@/lib/utils";

type MascotPlacement = {
  variant: MascotVariant;
  position: string; // tailwind classes for fixed position
  size?: "xs" | "sm" | "md";
};

function pickMascot(path: string): MascotPlacement {
  if (path.startsWith("/journal")) return { variant: "encourage", position: "bottom-24 left-4", size: "sm" };
  if (path.startsWith("/podcast")) return { variant: "comfort", position: "bottom-24 right-4", size: "sm" };
  if (path.startsWith("/vitamin")) return { variant: "idea", position: "bottom-24 right-4", size: "sm" };
  if (path.startsWith("/mood")) return { variant: "question", position: "bottom-24 left-4", size: "sm" };
  if (path.startsWith("/admin")) return { variant: "default", position: "bottom-24 right-4", size: "xs" };
  if (path.startsWith("/u/")) return { variant: "happy", position: "bottom-24 right-4", size: "sm" };
  return { variant: "happy", position: "bottom-24 right-4", size: "sm" };
}

export function PageShell({ children, mascot = true }: { children: ReactNode; mascot?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const m = pickMascot(path);

  return (
    <div className="min-h-screen bg-gradient-soft pb-32">
      <div className="max-w-3xl mx-auto px-5 pt-10 space-y-8">{children}</div>
      {mascot && (
        <div className={cn("fixed z-30 pointer-events-none", m.position)}>
          <Mascot size={m.size ?? "sm"} variant={m.variant} floating />
        </div>
      )}
      <BottomNav />
    </div>
  );
}
