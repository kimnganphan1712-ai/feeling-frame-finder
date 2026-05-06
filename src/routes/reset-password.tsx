import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses recovery hash automatically into a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else setErr("Liên kết không còn hiệu lực. Hãy yêu cầu gửi lại.");
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password.length < 6) return setErr("Mật khẩu cần ít nhất 6 ký tự.");
    if (password !== confirm) return setErr("Hai mật khẩu chưa khớp nhau.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setErr(error.message);
    setInfo("Mật khẩu đã được làm mới. Đang đưa bạn về Hospital Playlist…");
    setTimeout(() => navigate({ to: "/" }), 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-welcome flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/auth" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-3 h-3" /> Về trang đăng nhập
        </Link>
        <div className="glass-strong rounded-3xl shadow-soft border border-white/60 p-8">
          <div className="flex flex-col items-center text-center">
            <Mascot size="md" variant="loading" floating glow />
            <h1 className="mt-4 text-2xl font-semibold">Đặt lại mật khẩu</h1>
            <p className="text-sm text-muted-foreground mt-1">Một mật khẩu mới — một khởi đầu nhẹ nhàng hơn.</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div className="flex items-center gap-2 px-4 h-11 rounded-2xl bg-white/70">
              <Lock className="w-4 h-4 text-mint-deep/70" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu mới"
                className="w-full bg-transparent outline-none text-sm"
                disabled={!ready}
              />
            </div>
            <div className="flex items-center gap-2 px-4 h-11 rounded-2xl bg-white/70">
              <Lock className="w-4 h-4 text-mint-deep/70" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại"
                className="w-full bg-transparent outline-none text-sm"
                disabled={!ready}
              />
            </div>
            {err && <p className="text-xs text-destructive text-center">{err}</p>}
            {info && <p className="text-xs text-mint-deep text-center">{info}</p>}
            <Button type="submit" disabled={busy || !ready} className="w-full rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white h-11">
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu mật khẩu mới
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
