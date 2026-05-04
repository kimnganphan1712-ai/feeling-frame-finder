import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Mascot } from "./Mascot";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-soft flex flex-col items-center justify-center">
        <Mascot size="md" floating glow />
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">Đang mở cửa Trạm Dịu…</p>
      </div>
    );
  }
  return <>{children}</>;
}
