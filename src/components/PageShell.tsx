import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Mascot } from "./Mascot";

export function PageShell({ children, mascot = true }: { children: ReactNode; mascot?: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-soft pb-28">
      <div className="max-w-3xl mx-auto px-5 pt-8">{children}</div>
      {mascot && (
        <div className="fixed bottom-24 right-4 z-30 pointer-events-none">
          <Mascot size="sm" floating />
        </div>
      )}
      <BottomNav />
    </div>
  );
}
