import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mascot } from "./Mascot";
import { MoodSticker } from "./MoodSticker";
import { Button } from "@/components/ui/button";
import { Sparkles, Globe2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { moodCheckinStore, checkAdjective, MoodCheckin } from "@/lib/mood-checkin-store";
import { useTodayMood, stickerToMascot } from "@/lib/today-mood";
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

  const selectedSticker = STICKERS.find((s) => s.type === stickerType) ?? null;
  const liveMascot = thanks ? "happy" : selectedSticker ? stickerToMascot(selectedSticker.type) : existing ? "encourage" : "question";

  return (
    <div className="fixed inset-0 z-50 bg-gradient-welcome/85 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-up_0.7s_ease-out]">
      <div className="glass-strong rounded-[2rem] shadow-[0_20px_60px_-20px_rgba(80,120,140,0.25)] max-w-xl w-full p-8 md:p-10 relative border-0 ring-1 ring-white/50">
        <div className="flex flex-col items-center text-center">
          <Mascot size="md" variant={liveMascot} floating />

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
                  Vào trạm
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
              <h2 className="mt-5 text-2xl md:text-3xl font-display font-medium leading-snug max-w-md">
                Chào mừng bạn đến Trạm cứu hộ cảm xúc
              </h2>
              <p className="mt-3 text-base md:text-[17px] text-muted-foreground max-w-md leading-relaxed">
                Hôm nay, hãy để nơi này ôm ấp cảm xúc của bạn một chút nhé. Chỉ cần một từ thôi — cảm xúc nào cũng xứng đáng được lắng nghe.
              </p>

              <div className="w-full mt-7">
                <input
                  type="text"
                  value={adjective}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[\n\r]/g, "");
                    setAdjective(v.slice(0, 24));
                    if (error) setError(null);
                  }}
                  maxLength={24}
                  placeholder="Ví dụ: bình yên, mệt mỏi, chênh vênh, biết ơn…"
                  className="w-full text-center text-lg md:text-xl font-display rounded-3xl px-5 py-4 bg-white/70 border-0 ring-1 ring-white/70 focus:outline-none focus:ring-2 focus:ring-mint-deep/40 placeholder:text-muted-foreground/60 shadow-sm transition-all"
                />
                <div className="mt-1.5 text-[11px] text-muted-foreground text-right pr-2">
                  {adjective.length}/20
                </div>
              </div>

              <p className="mt-4 text-sm md:text-[15px] text-mint-deep/90 font-medium">
                Chọn một tín hiệu để trạm hiểu bạn hơn
              </p>
              <div className="mt-4 grid grid-cols-5 gap-x-3 gap-y-4 sm:gap-x-5 sm:gap-y-5 justify-items-center w-full max-w-md">
                {STICKERS.map((s) => (
                  <button
                    key={s.type}
                    type="button"
                    onClick={() => { setStickerType(s.type); if (error) setError(null); }}
                    className="flex flex-col items-center gap-1.5 group focus:outline-none"
                  >
                    <MoodSticker
                      sticker={s}
                      size={52}
                      selected={stickerType === s.type}
                      title={s.label}
                    />
                    <span
                      className={`text-[11px] sm:text-xs leading-tight transition-colors ${
                        stickerType === s.type
                          ? "text-mint-deep font-semibold"
                          : "text-muted-foreground group-hover:text-foreground/80"
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>

              {selectedSticker?.reaction && (
                <p
                  key={selectedSticker.type}
                  className="mt-4 text-sm md:text-[15px] text-foreground/85 italic max-w-md animate-[fade-up_0.4s_ease-out]"
                >
                  {selectedSticker.reaction}
                </p>
              )}

              {error && (
                <p className="mt-4 text-sm text-blush-deep bg-blush/30 px-4 py-2 rounded-full">
                  {error}
                </p>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3 w-full">
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="rounded-full text-muted-foreground hover:text-foreground text-base"
                >
                  Bỏ qua hôm nay
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white px-7 py-5 text-base shadow-soft transition-all"
                >
                  {submitting ? "Đang gửi…" : "Gửi về trạm"}
                </Button>
              </div>

              <p className="mt-5 text-xs md:text-[13px] text-muted-foreground italic max-w-sm leading-relaxed">
                Cảm xúc của bạn sẽ trở thành một chấm sáng ẩn danh trên bản đồ cảm xúc chung. Không ai biết đó là bạn — chỉ biết rằng hôm nay, có một người cũng đang ôm ấp cảm xúc giống mình.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
