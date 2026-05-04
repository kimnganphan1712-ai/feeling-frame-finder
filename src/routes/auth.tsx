import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

const emailSchema = z.string().trim().email({ message: "Email chưa hợp lệ" }).max(255);
const passwordSchema = z.string().min(6, { message: "Mật khẩu cần ít nhất 6 ký tự" }).max(128);
const nameSchema = z.string().trim().min(1, { message: "Hãy đặt cho mình một cái tên dịu dàng" }).max(60);

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const reset = () => {
    setErr("");
    setInfo("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (z) {
      const m = (z as z.ZodError).issues[0]?.message ?? "Thông tin chưa hợp lệ";
      return setErr(m);
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (error.message.includes("Invalid login")) setErr("Email hoặc mật khẩu chưa đúng.");
      else setErr(error.message);
      return;
    }
    navigate({ to: "/" });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    try {
      nameSchema.parse(name);
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (z) {
      const m = (z as z.ZodError).issues[0]?.message ?? "Thông tin chưa hợp lệ";
      return setErr(m);
    }
    if (password !== confirm) return setErr("Hai mật khẩu chưa khớp nhau.");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name },
      },
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("registered")) setErr("Email này đã có người dùng. Bạn thử đăng nhập nhé.");
      else setErr(error.message);
      return;
    }
    navigate({ to: "/" });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    try {
      emailSchema.parse(email);
    } catch {
      return setErr("Email chưa hợp lệ");
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return setErr(error.message);
    setInfo("Mình đã gửi một lá thư đến hộp mail của bạn. Hãy kiểm tra để đặt lại mật khẩu nhé.");
  };

  const handleGoogle = async () => {
    reset();
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      setErr("Không thể đăng nhập với Google. Hãy thử lại nhé.");
      return;
    }
    if (result.redirected) return; // browser navigates
    setBusy(false);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-welcome flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-3 h-3" /> Quay về Trạm Dịu
        </Link>

        <div className="glass-strong rounded-3xl shadow-soft border border-white/60 p-7 md:p-8">
          <div className="flex flex-col items-center text-center">
            <Mascot size="md" floating glow />
            <h1 className="mt-4 text-2xl font-semibold">
              {mode === "login" && "Chào bạn quay lại"}
              {mode === "signup" && "Bắt đầu cùng Trạm Dịu"}
              {mode === "forgot" && "Quên mật khẩu"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {mode === "login" && "Đăng nhập để tiếp tục hành trình cảm xúc của bạn."}
              {mode === "signup" && "Tạo cho mình một góc riêng — mọi điều bạn viết đều được giữ kín."}
              {mode === "forgot" && "Nhập email — mình sẽ gửi cho bạn một lá thư để đặt lại."}
            </p>
          </div>

          <form
            onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot}
            className="mt-6 space-y-3"
          >
            {mode === "signup" && (
              <Field icon={<UserIcon className="w-4 h-4" />}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên hiển thị"
                  className="w-full bg-transparent outline-none text-sm"
                  autoComplete="name"
                />
              </Field>
            )}
            <Field icon={<Mail className="w-4 h-4" />}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email"
                className="w-full bg-transparent outline-none text-sm"
                autoComplete="email"
              />
            </Field>
            {mode !== "forgot" && (
              <Field icon={<Lock className="w-4 h-4" />}>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Mật khẩu"
                  className="w-full bg-transparent outline-none text-sm"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </Field>
            )}
            {mode === "signup" && (
              <Field icon={<Lock className="w-4 h-4" />}>
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  className="w-full bg-transparent outline-none text-sm"
                  autoComplete="new-password"
                />
              </Field>
            )}

            {err && <p className="text-xs text-destructive text-center">{err}</p>}
            {info && <p className="text-xs text-mint-deep text-center">{info}</p>}

            <Button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white h-11"
            >
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "login" && "Đăng nhập"}
              {mode === "signup" && "Tạo tài khoản"}
              {mode === "forgot" && "Gửi lá thư"}
            </Button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">hoặc</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                variant="outline"
                className="w-full rounded-full h-11 bg-white/80 hover:bg-white"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Tiếp tục với Google
              </Button>
            </>
          )}

          <div className="mt-5 text-center text-sm">
            {mode === "login" && (
              <>
                <button onClick={() => { setMode("forgot"); reset(); }} className="text-muted-foreground hover:text-mint-deep">
                  Quên mật khẩu?
                </button>
                <p className="mt-3 text-muted-foreground">
                  Chưa có tài khoản?{" "}
                  <button onClick={() => { setMode("signup"); reset(); }} className="text-mint-deep font-medium">
                    Đăng ký
                  </button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p className="text-muted-foreground">
                Đã có tài khoản?{" "}
                <button onClick={() => { setMode("login"); reset(); }} className="text-mint-deep font-medium">
                  Đăng nhập
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <button onClick={() => { setMode("login"); reset(); }} className="text-mint-deep font-medium">
                ← Quay lại đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 h-11 rounded-2xl bg-white/70 border border-white/80 focus-within:ring-2 focus-within:ring-mint-deep/40">
      <span className="text-mint-deep/70">{icon}</span>
      {children}
    </div>
  );
}
