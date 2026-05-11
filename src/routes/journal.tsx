import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Mascot } from "@/components/Mascot";
import { PinPad, PinPadHandle } from "@/components/PinPad";
import { RichEditor, RichEditorHandle } from "@/components/RichEditor";
import { MoodPicker } from "@/components/MoodPicker";
import { TimeCapsuleDialog } from "@/components/TimeCapsuleDialog";
import { AmbientToggle } from "@/components/AmbientToggle";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cloudStore, JournalEntry } from "@/lib/cloud-store";
import { MoodKey } from "@/lib/mood";
import { Lock, Sparkles, Clock, Save, Loader2, Check, BookOpen, ChevronLeft, Plus, KeyRound } from "lucide-react";
import { CinematicBanner } from "@/components/CinematicBanner";
import { IMAGE_SLOTS } from "@/lib/site-images-store";
import journalFallback from "@/assets/hp-journal.jpg";

const IDLE_MS = 5 * 60 * 1000; // 5 phút auto-lock

export const Route = createFileRoute("/journal")({
  component: () => (
    <RequireAuth>
      <JournalPage />
    </RequireAuth>
  ),
});

const PROMPTS = [
  "Hôm nay điều gì khiến bạn suy nghĩ nhiều nhất?",
  "Một điều nhỏ bé khiến bạn mỉm cười?",
  "Bạn có đang ổn không?",
  "Một điều bạn biết ơn hôm nay?",
  "Bạn muốn nói gì với mình của một tuần trước?",
  "Cơ thể bạn đang nói với bạn điều gì?",
];

type Stage = "locked" | "setup" | "verify" | "room" | "editor" | "list" | "change-pin";
type ChangeStep = "verify-old" | "new-1" | "new-2";

function JournalPage() {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("locked");
  const [error, setError] = useState("");
  const [pinReady, setPinReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const pinRef = useRef<PinPadHandle>(null);

  // editor state
  const editorRef = useRef<RichEditorHandle>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState("Một ngày dịu nhẹ");
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [capsuleOpen, setCapsuleOpen] = useState(false);

  // change-pin flow
  const [changeStep, setChangeStep] = useState<ChangeStep>("verify-old");
  const [newPinFirst, setNewPinFirst] = useState("");
  const [changeMsg, setChangeMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // ---- auto-lock when idle inside protected stages ----
  const isUnlocked = stage === "room" || stage === "editor" || stage === "list";
  useEffect(() => {
    if (!isUnlocked) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setStage("locked");
        setCurrentId(null);
        setSavedAt(null);
        setError("");
      }, IDLE_MS);
    };
    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [isUnlocked]);

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // ---- open journal directly to PIN screen ----
  useEffect(() => {
    if (!user || stage !== "locked") return;
    let alive = true;
    setPinReady(false);
    setError("");
    cloudStore.hasPin(user.id)
      .then((has) => {
        if (!alive) return;
        setStage(has ? "verify" : "setup");
      })
      .catch(() => {
        if (!alive) return;
        setError("Không kiểm tra được PIN. Hãy tải lại trang giúp mình nhé.");
      })
      .finally(() => {
        if (alive) setPinReady(true);
      });
    return () => { alive = false; };
  }, [stage, user]);

  // ---- PIN flows ----
  const handleSetupPin = async (pin: string) => {
    setError("");
    setChecking(true);
    const { error } = await cloudStore.setPin(pin);
    setChecking(false);
    if (error) {
      setError(error);
      pinRef.current?.shake();
      pinRef.current?.reset();
      return;
    }
    enterRoom();
  };

  const handleVerifyPin = async (pin: string) => {
    setError("");
    setChecking(true);
    const ok = await cloudStore.verifyPin(pin);
    setChecking(false);
    if (!ok) {
      setError("Mật khẩu chưa đúng. Hít một hơi sâu rồi thử lại nhé.");
      pinRef.current?.shake();
      pinRef.current?.reset();
      return;
    }
    enterRoom();
  };

  // ---- change PIN ----
  const startChangePin = () => {
    setChangeStep("verify-old");
    setNewPinFirst("");
    setChangeMsg(null);
    setError("");
    setStage("change-pin");
    setTimeout(() => pinRef.current?.reset(), 50);
  };

  const handleChangePin = async (pin: string) => {
    setError("");
    if (changeStep === "verify-old") {
      setChecking(true);
      const ok = await cloudStore.verifyPin(pin);
      setChecking(false);
      if (!ok) {
        setError("PIN cũ chưa đúng.");
        pinRef.current?.shake();
        pinRef.current?.reset();
        return;
      }
      setChangeStep("new-1");
      pinRef.current?.reset();
      return;
    }
    if (changeStep === "new-1") {
      setNewPinFirst(pin);
      setChangeStep("new-2");
      pinRef.current?.reset();
      return;
    }
    // new-2
    if (pin !== newPinFirst) {
      setError("Hai PIN mới chưa khớp. Thử lại nhé.");
      setChangeStep("new-1");
      setNewPinFirst("");
      pinRef.current?.shake();
      pinRef.current?.reset();
      return;
    }
    setChecking(true);
    const { error: e } = await cloudStore.setPin(pin);
    setChecking(false);
    if (e) {
      setError(e);
      pinRef.current?.shake();
      pinRef.current?.reset();
      return;
    }
    setChangeMsg({ kind: "ok", text: "Đã đổi PIN thành công 🌿" });
    setTimeout(() => setStage("locked"), 1400);
  };

  const enterRoom = async () => {
    // Vào thẳng editor ngay sau khi PIN đúng — không chờ màn chuyển cảnh.
    setStage("editor");
    setError("");
    if (user) {
      cloudStore.listEntries(user.id).then(setEntries).catch(() => {});
    }
  };

  // ---- editor ----
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const html = editorRef.current?.getHtml() ?? "";
    const id = await cloudStore.saveEntry(user.id, {
      id: currentId ?? undefined,
      title, body: html, mood,
    });
    if (id) setCurrentId(id);
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString("vi-VN"));
    // refresh list silently
    cloudStore.listEntries(user.id).then(setEntries);
  };

  const handleNewEntry = () => {
    setCurrentId(null);
    setTitle("Một ngày dịu nhẹ");
    setMood(null);
    setSavedAt(null);
    editorRef.current?.setHtml("");
    setStage("editor");
  };

  const openEntry = (e: JournalEntry) => {
    setCurrentId(e.id);
    setTitle(e.title || "Một ngày dịu nhẹ");
    setMood((e.mood as MoodKey | null) ?? null);
    setSavedAt(null);
    setStage("editor");
    setTimeout(() => editorRef.current?.setHtml(e.body || ""), 50);
  };

  const handleSaveCapsule = async ({ intervalKind, deliverAt }: { intervalKind: "once" | "daily" | "monthly"; deliverAt: string }) => {
    if (!user) return;
    // Make sure entry is saved first
    let id = currentId;
    if (!id) {
      const html = editorRef.current?.getHtml() ?? "";
      id = await cloudStore.saveEntry(user.id, { title, body: html, mood });
      if (id) setCurrentId(id);
    }
    if (id) await cloudStore.createCapsule(user.id, id, deliverAt, intervalKind);
  };

  // ===== STAGE: LOCKED =====
  if (stage === "locked") {
    return (
      <PageShell mascot={false}>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-[fade-up_0.8s_ease-out] relative">
          <div className="absolute inset-0 bg-gradient-mascot opacity-40 -z-0" />
          <Mascot size="lg" variant="encourage" floating glow />
          <h1 className="mt-6 text-3xl font-semibold">Hồ sơ cảm xúc</h1>
          <p className="mt-3 text-muted-foreground max-w-sm leading-relaxed">
            Căn phòng riêng để bạn lưu lại những điều trái tim đã đi qua.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-mint-deep">
            <Lock className="w-3.5 h-3.5" /> Riêng tư · Khoá bằng PIN 6 số
          </div>
          <div className="mt-8 flex items-center gap-2 text-mint-deep text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {pinReady ? "Đang chuẩn bị mã PIN…" : "Đang mở phòng riêng…"}
          </div>
          {error && (
            <p className="mt-3 text-xs text-destructive">{error}</p>
          )}
          <button
            onClick={async () => {
              if (!user) return;
              const has = await cloudStore.hasPin(user.id);
              if (has) startChangePin();
            }}
            className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-mint-deep underline-offset-4 hover:underline"
          >
            <KeyRound className="w-3 h-3" /> Đổi mã PIN
          </button>
        </div>
      </PageShell>
    );
  }

  // ===== STAGE: PIN (setup or verify) =====
  if (stage === "setup" || stage === "verify") {
    const isSetup = stage === "setup";
    const heading = isSetup
      ? "Đặt mã PIN cho phòng riêng"
      : "Nhập mã PIN của bạn";
    const sub = isSetup
      ? "Chọn 6 chữ số — nhập xong là vào nhật ký ngay."
      : "Cánh cửa đang chờ bạn. Nhập 6 số để bước vào.";

    return (
      <PageShell mascot={false}>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-[fade-up_0.5s_ease-out]">
          <div className="w-14 h-14 rounded-2xl bg-mint/40 flex items-center justify-center text-mint-deep">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold">{heading}</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">{sub}</p>

          <div className="mt-7">
            <PinPad
              ref={pinRef}
              onComplete={isSetup ? handleSetupPin : handleVerifyPin}
              disabled={checking}
            />
          </div>

          {error && (
            <p className="mt-4 text-xs text-destructive">{error}</p>
          )}
          {checking && (
            <div className="mt-4 flex items-center gap-2 text-mint-deep text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang mở cửa…
            </div>
          )}

          <button
            onClick={() => { setStage("locked"); setError(""); }}
            className="mt-8 text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            ← Quay lại
          </button>
        </div>
      </PageShell>
    );
  }

  // ===== STAGE: ROOM (transition) =====
  if (stage === "room") {
    return (
      <div className="fixed inset-0 z-40 bg-gradient-welcome flex flex-col items-center justify-center p-6 text-center animate-[fade-up_0.8s_ease-out]">
        <div className="absolute inset-0 backdrop-blur-3xl bg-white/30" />
        <div className="relative">
          <Mascot size="xl" variant="comfort" floating glow />
          <p className="mt-6 text-sm text-mint-deep uppercase tracking-widest">Phòng riêng của bạn</p>
          <p className="mt-2 text-xl text-foreground/80 italic">"Bạn có thể nói thật mọi thứ ở đây."</p>
        </div>
      </div>
    );
  }

  // ===== STAGE: CHANGE PIN =====
  if (stage === "change-pin") {
    const heading =
      changeStep === "verify-old" ? "Nhập PIN hiện tại"
      : changeStep === "new-1" ? "Đặt PIN mới"
      : "Nhập lại PIN mới";
    const sub =
      changeStep === "verify-old" ? "Xác nhận đó là bạn trước khi đổi."
      : changeStep === "new-1" ? "Chọn 6 chữ số mới."
      : "Một lần nữa cho chắc nhé.";

    return (
      <PageShell mascot={false}>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-[fade-up_0.5s_ease-out]">
          <div className="w-14 h-14 rounded-2xl bg-blush/40 flex items-center justify-center text-blush-deep">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold">{heading}</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">{sub}</p>

          <div className="mt-7">
            <PinPad ref={pinRef} onComplete={handleChangePin} disabled={checking || !!changeMsg} />
          </div>

          {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
          {changeMsg && (
            <p className={`mt-4 text-sm ${changeMsg.kind === "ok" ? "text-mint-deep" : "text-destructive"}`}>
              {changeMsg.text}
            </p>
          )}
          {checking && (
            <div className="mt-4 flex items-center gap-2 text-mint-deep text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý…
            </div>
          )}

          <button
            onClick={() => { setStage("locked"); setError(""); setChangeMsg(null); }}
            className="mt-8 text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            ← Huỷ
          </button>
        </div>
      </PageShell>
    );
  }

  // ===== STAGE: LIST =====
  if (stage === "list") {
    return (
      <PageShell mascot={false}>
        <CinematicBanner
          slot={IMAGE_SLOTS.journalBanner}
          fallbackSrc={journalFallback}
          kicker="Track 06 — Journal"
          title="Hồ sơ cảm xúc"
          subtitle="Một phòng riêng dịu nhẹ — nơi bạn có thể viết thật mọi điều."
          height="md"
        >
          <Button onClick={handleNewEntry} size="sm" className="cta-glow group rounded-full bg-warm hover:bg-warm/90 text-navy">
            <Plus className="w-4 h-4 mr-1 icon-wiggle" /> Bài mới
          </Button>
        </CinematicBanner>

        <header className="flex items-center justify-between my-5 animate-[fade-up_0.5s_ease-out]">
          <div className="flex items-center gap-2">
            <button onClick={() => setStage("editor")} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Nhật ký</p>
              <h1 className="text-2xl font-semibold mt-0.5">Tất cả bài viết</h1>
            </div>
          </div>
        </header>

        <div className="space-y-3">
          {entries.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-12">Chưa có bài nào. Hãy bắt đầu trang đầu tiên 🌿</p>
          )}
          {entries.map((e) => (
            <button
              key={e.id}
              onClick={() => openEntry(e)}
              className="group lift-card w-full text-left rounded-2xl p-4 glass shadow-card border border-white/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{e.title || "Không tiêu đề"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(e.created_at).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                  </p>
                  <p className="text-xs text-foreground/70 mt-2 line-clamp-2">
                    {(e.body || "").replace(/<[^>]+>/g, " ").slice(0, 140)}
                  </p>
                </div>
                {e.mood && <span className="text-2xl icon-bounce">{moodEmoji(e.mood)}</span>}
              </div>
            </button>
          ))}
        </div>
      </PageShell>
    );
  }

  // ===== STAGE: EDITOR =====
  return (
    <PageShell mascot={false}>
      <header className="flex items-center justify-between mb-4 gap-3 animate-[fade-up_0.5s_ease-out]">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" /> Phòng riêng
          </p>
          <h1 className="text-2xl font-semibold mt-0.5 truncate">{currentId ? "Đang xem lại" : "Bài viết hôm nay"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <AmbientToggle />
          <button
            onClick={() => setStage("list")}
            className="inline-flex items-center gap-1 text-xs px-3 h-8 rounded-full bg-white/70 hover:bg-white text-foreground/70"
          >
            <BookOpen className="w-3.5 h-3.5" /> Tất cả ({entries.length})
          </button>
          <Mascot size="xs" variant="idea" floating />
        </div>
      </header>

      <div className="rounded-3xl glass-strong shadow-card overflow-hidden border border-white/60 animate-[fade-up_0.5s_ease-out]">
        <div className="p-5 md:p-7">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề nhật ký…"
            className="w-full text-2xl md:text-3xl font-semibold bg-transparent outline-none placeholder:text-muted-foreground/50"
          />
          <p className="text-xs text-muted-foreground mt-1">{today}{savedAt && ` · Lưu lúc ${savedAt} 🌿`}</p>

          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Hôm nay bạn đang…</p>
            <MoodPicker value={mood} onChange={setMood} size="sm" />
          </div>

          <div className="mt-5">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-mint-deep" /> Gợi ý từ mascot — bấm để chèn
            </p>
            <div className="flex flex-wrap gap-2">
              {PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => editorRef.current?.insertText(p + "\n")}
                  className="text-xs px-3 py-1.5 rounded-full bg-blush/40 hover:bg-blush/70 text-foreground/80 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <RichEditor ref={editorRef} onInput={() => setSavedAt(null)} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving} className="cta-glow cta-scrub group rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : savedAt ? <Check className="w-4 h-4 mr-2 icon-wiggle" /> : <Save className="w-4 h-4 mr-2 icon-wiggle" />}
              {savedAt ? "Đã lưu 🌿" : "Lưu"}
            </Button>
            <Button
              onClick={() => setCapsuleOpen(true)}
              variant="outline"
              className="cta-glow group rounded-full bg-blush-deep/10 hover:bg-blush-deep/20 text-blush-deep border-blush-deep/30"
            >
              <Clock className="w-4 h-4 mr-2 icon-wiggle" /> Gửi cho mình trong tương lai
            </Button>
            {currentId && (
              <Button onClick={handleNewEntry} variant="ghost" className="cta-glow group rounded-full">
                <Plus className="w-4 h-4 mr-1 icon-wiggle" /> Bài mới
              </Button>
            )}
          </div>
        </div>
      </div>

      <Link to="/" className="inline-block mt-6 text-xs text-muted-foreground hover:text-foreground">
        ← Về trạm chính
      </Link>

      <TimeCapsuleDialog
        open={capsuleOpen}
        onClose={() => setCapsuleOpen(false)}
        preview={editorRef.current?.getHtml() ?? ""}
        onSave={handleSaveCapsule}
      />
    </PageShell>
  );
}

function moodEmoji(m: string) {
  return ({ joy: "🌿", calm: "🌼", anger: "🔥", sad: "💧" } as Record<string, string>)[m] ?? "🌱";
}
