import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mascot } from "./Mascot";
import { MoodSticker } from "./MoodSticker";
import { Button } from "@/components/ui/button";
import { Sparkles, Globe2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { moodCheckinStore, checkAdjective, MoodCheckin } from "@/lib/mood-checkin-store";
import { useTodayMood } from "@/lib/today-mood";
import { STICKERS } from "@/lib/stickers";

interface Props {
  onDone: () => void | Promise<void>;
  onSkip?: () => void;
}

export function MoodCheckIn({ onDone, onSkip }: Props) {
  const { user, displayName } = useAuth();
  const { setCheckin } = useTodayMood();
  const [adjective, setAdjective] = useState("");
  const [stickerType, setStickerType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<MoodCheckin | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    if (!user) return;
    moodCheckinStore.getToday(user.id).then((row) => {
      setExisting(row);
      setLoaded(true);
    });
  }, [user]);

  const handleSubmit = async () => {
    setError(null);
    const check = checkAdjective(adjective);
    if (!check.ok) { setError(check.error ?? null); return; }
    const sticker = STICKERS.find((s) => s.type === stickerType);
    if (!sticker) {
      setError("Bạn hãy viết một tính từ và chọn một sticker trước nha.");
      return;
    }
    if (!user) return;
    setSubmitting(true);
    const username = (displayName?.trim() || user.email?.split("@")[0] || "bạn").slice(0, 32);
    const res = await moodCheckinStore.submit({
      user_id: user.id,
      username,
      adjective: check.value,
      sticker_type: sticker.type,
      sticker_color: sticker.color,
    });
    setSubmitting(false);
    if (res.error) {
      if (/duplicate/i.test(res.error) || /unique/i.test(res.error)) {
        setError("Bạn đã gửi cảm xúc hôm nay rồi. Hẹn gặp bạn vào ngày mai nhé.");
        return;
      }
      setError(res.error);
      return;
    }
    if (res.data) setCheckin(res.data);
    setThanks(true);
    setTimeout(() => onDone(), 1400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-welcome/85 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-up_0.5s_ease-out]">
      <div className="glass-strong rounded-3xl shadow-soft max-w-lg w-full p-7 md:p-9 relative border border-white/60">
        <div className="flex flex-col items-center text-center">
          <Mascot size="md" variant={thanks ? "happy" : existing ? "encourage" : "question"} floating />

          {!loaded ? (
            <div className="py-12 text-sm text-muted-foreground">Đang lắng nghe…</div>
          ) : existing ? (
            <>
              <h2 className="mt-4 text-xl md:text-2xl font-display font-medium">
                Bạn đã gửi cảm xúc hôm nay rồi
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Hẹn gặp bạn vào ngày mai nhé. Hôm nay bạn đã gọi tên cảm xúc của mình rồi.
              </p>
              <div className="mt-5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 border border-white/70">
                <MoodSticker sticker={{
                  type: existing.sticker_type,
                  label: existing.adjective,
                  color: existing.sticker_color,
                  face: (STICKERS.find(s => s.type === existing.sticker_type)?.face) ?? "calm",
                }} size={48} />
                <div className="text-left">
                  <p className="font-medium capitalize">{existing.adjective}</p>
                  <p className="text-xs text-muted-foreground">{existing.username}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Link to="/mood-board">
                  <Button variant="outline" className="rounded-full">
                    <Globe2 className="w-4 h-4 mr-2" /> Xem bản đồ cảm xúc
                  </Button>
                </Link>
                <Button onClick={() => onDone()} className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
                  Vào trạm dịu
                </Button>
              </div>
            </>
          ) : thanks ? (
            <div className="py-6 animate-[fade-up_0.5s_ease-out]">
              <div className="inline-flex items-center gap-2 text-mint-deep text-xs">
                <Sparkles className="w-3.5 h-3.5" /> Đã gửi tới bản đồ cảm xúc
              </div>
              <p className="mt-3 text-base text-foreground/85 italic">
                Cảm ơn bạn đã chia sẻ một tính từ hôm nay.
              </p>
            </div>
          ) : (
            <>
              <h2 className="mt-4 text-xl md:text-2xl font-display font-medium">
                Hôm nay cảm xúc của bạn là gì?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                Hãy mô tả cảm xúc của bạn bằng 1 tính từ và chọn một sticker phù hợp nhé.
              </p>

              <div className="w-full mt-5">
                <input
                  type="text"
                  value={adjective}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[\n\r]/g, "");
                    setAdjective(v.slice(0, 24));
                    if (error) setError(null);
                  }}
                  maxLength={24}
                  placeholder="Ví dụ: bình yên, biết ơn, mệt mỏi, trống rỗng, vui vẻ..."
                  className="w-full text-center text-base md:text-lg font-display rounded-2xl px-4 py-3 bg-white/70 border border-white/80 focus:outline-none focus:ring-2 focus:ring-mint-deep/40 placeholder:text-muted-foreground/60"
                />
                <div className="mt-1 text-[11px] text-muted-foreground text-right pr-1">
                  {adjective.length}/20
                </div>
              </div>

              <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-mint-deep/80">
                chọn sticker đại diện
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-3">
                {STICKERS.map((s) => (
                  <MoodSticker
                    key={s.type}
                    sticker={s}
                    size={52}
                    selected={stickerType === s.type}
                    onClick={() => { setStickerType(s.type); if (error) setError(null); }}
                    title={s.label}
                  />
                ))}
              </div>

              {error && (
                <p className="mt-4 text-xs text-blush-deep bg-blush/30 px-3 py-2 rounded-full">
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 w-full">
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  Bỏ qua hôm nay
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white px-6 shadow-soft"
                >
                  {submitting ? "Đang gửi…" : "Gửi cảm xúc"}
                </Button>
              </div>

              <p className="mt-4 text-[11px] text-muted-foreground italic max-w-xs">
                Cảm xúc của bạn sẽ được hiển thị công khai trên bản đồ cảm xúc — chỉ một tính từ, để giữ sự riêng tư.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
