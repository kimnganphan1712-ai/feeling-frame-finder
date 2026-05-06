import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Mascot } from "./Mascot";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate({ to: "/auth" });
      } else if (role !== null && role !== "admin") {
        navigate({ to: "/" });
      }
    }
  }, [user, loading, role, navigate]);

  if (loading || !user || role === null) {
    return (
      <div className="min-h-screen bg-gradient-soft flex flex-col items-center justify-center">
        <Mascot size="md" variant="loading" floating glow />
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">Đang kiểm tra quyền hạn…</p>
      </div>
    );
  }

  if (role !== "admin") {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
