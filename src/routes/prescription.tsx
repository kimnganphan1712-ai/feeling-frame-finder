import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { useTodayMood } from "@/lib/today-mood";
import { localDateKey } from "@/lib/utils";
import {
  Heart,
  Copy,
  Sparkles,
  Wind,
  BookHeart,
  Headphones,
  Pill,
  Stethoscope,
  RefreshCw,
  Check,
} from "lucide-react";
import {
  pickDailyPrescription,
  MOOD_CARDS,
  NEED_PACKS,
  MASCOT_NOTES,
  pickRandomNote,
  listSavedNotes,
  toggleSavedNote,
  getMoodCardByKey,
  type MoodCard,
  type NeedPack,
} from "@/lib/prescriptions";
import { toast } from "sonner";

export const Route = createFileRoute("/prescription")({
  head: () => ({
    meta: [
      { title: "Đơn thuốc tinh thần — Trạm cứu hộ cảm xúc" },
      {
        name: "description",
        content:
          "Những lời nhắn chữa lành và toa thuốc tinh thần dịu dàng cho trái tim bạn hôm nay.",
      },
      { property: "og:title", content: "Đơn thuốc tinh thần — Trạm cứu hộ cảm xúc" },
      {
        property: "og:description",
        content: "Lời nhắn dịu dàng được kê riêng cho trái tim hôm nay.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <PrescriptionPage />
    </RequireAuth>
  ),
});

function PrescriptionPage() {
  const { moodKey, adjective } = useTodayMood();
  const today = useMemo(() => localDateKey(), []);
  const daily = useMemo(() => pickDailyPrescription(today), [today]);
  const moodSuggested = getMoodCardByKey(moodKey);

  const [openMood, setOpenMood] = useState<MoodCard | null>(moodSuggested);
  const [openPack, setOpenPack] = useState<NeedPack | null>(null);
  const [randomNote, setRandomNote] = useState<string>(() => pickRandomNote());
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    setSaved(listSavedNotes());
  }, []);

  useEffect(() => {
    if (moodSuggested && !openMood) setOpenMood(moodSuggested);
  }, [moodSuggested, openMood]);

  const isSaved = (t: string) => saved.includes(t);
  const handleSave = (t: string) => {
    const next = toggleSavedNote(t);
    setSaved(next);
    toast.success(next.includes(t) ? "Đã lưu vào toa thuốc của bạn" : "Đã bỏ khỏi danh sách lưu");
  };

  const handleCopy = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
      toast.success("Đã sao chép lời nhắn");
    } catch {
      toast.error("Không sao chép được");
    }
  };

  const reroll = () => setRandomNote(pickRandomNote(randomNote));

  const todayDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
  }, []);

  return (
    <PageShell mascot={false}>
      {/* Hero */}
      <section className="text-center pt-6 pb-2 animate-[fade-up_0.6s_ease-out]">
        <div className="flex justify-center gap-3 mb-3">
          <Mascot variant="idea" size="sm" floating />
          <Mascot variant="comfort" size="sm" floating />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium leading-tight">
          Đơn thuốc tinh thần
        </h1>
        <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Những lời nhắn dịu dàng được kê riêng cho trái tim hôm nay.
        </p>
        <p className="mt-2 text-sm text-muted-foreground/80 max-w-xl mx-auto">
          Mỗi ngày, bạn có thể nhận một lời nhắn nhỏ, một toa thuốc tinh thần, hoặc một gợi ý dịu
          dàng để đi qua hôm nay nhẹ hơn một chút.
        </p>
      </section>

      {/* Daily prescription card */}
      <section className="animate-[fade-up_0.7s_ease-out]">
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope className="w-4 h-4 text-mint-deep" />
          <h2 className="font-display text-lg">Đơn thuốc hôm nay</h2>
        </div>
        <div className="relative glass-strong rounded-[2rem] p-7 md:p-9 shadow-[0_20px_60px_-30px_rgba(80,120,140,0.25)] ring-1 ring-mint/30">
          <div className="absolute -top-3 left-7 px-3 py-1 rounded-full bg-mint/40 text-mint-deep text-[11px] tracking-wider uppercase">
            Trạm cứu hộ cảm xúc · {todayDate}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Chẩn đoán cảm xúc</div>
          <p className="mt-2 font-display text-xl md:text-2xl leading-snug">
            “{daily.diagnosis}”
          </p>
          {adjective && (
            <p className="mt-2 text-sm text-mint-deep/90">
              Dựa trên cảm xúc bạn gửi sáng nay: <em>{adjective}</em>
            </p>
          )}
          <div className="mt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Kê đơn</div>
            <ol className="space-y-3">
              {daily.lines.map((l, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-mint/40 text-mint-deep text-xs font-semibold inline-flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-base md:text-[17px] leading-relaxed text-foreground/85">
                    {l}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-7 flex items-end justify-between gap-3">
            <div className="text-right ml-auto">
              <div className="font-display italic text-2xl text-mint-deep">Bác sĩ cảm xúc</div>
              <div className="text-[11px] text-muted-foreground">Trạm cứu hộ cảm xúc</div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => handleCopy(`${daily.diagnosis}\n\n${daily.lines.map((l, i) => `${i + 1}. ${l}`).join("\n")}`)}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Sao chép đơn
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => handleSave(daily.diagnosis)}
            >
              {isSaved(daily.diagnosis) ? (
                <><Check className="w-3.5 h-3.5 mr-1.5" /> Đã lưu</>
              ) : (
                <><Heart className="w-3.5 h-3.5 mr-1.5" /> Lưu lại</>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Mood cards grid */}
      <section className="animate-[fade-up_0.8s_ease-out]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-mint-deep" />
          <h2 className="font-display text-lg">Lời nhắn theo cảm xúc</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Chọn cảm xúc đang gần với bạn nhất hôm nay nhé.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MOOD_CARDS.map((m) => (
            <button
              key={m.slug}
              onClick={() => setOpenMood(m)}
              className={`group rounded-3xl p-4 text-left bg-gradient-to-br ${m.color} hover:shadow-soft hover:-translate-y-0.5 transition-all ring-1 ring-white/60 ${moodSuggested?.slug === m.slug ? "ring-2 ring-mint-deep/40" : ""}`}
            >
              <div className="text-2xl mb-1">{m.emoji}</div>
              <div className="font-display text-base">{m.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1 group-hover:text-foreground/70">
                Xem toa →
              </div>
            </button>
          ))}
        </div>
      </section>

      {openMood && (
        <MoodPrescriptionPanel
          card={openMood}
          isSuggested={moodSuggested?.slug === openMood.slug}
          onClose={() => setOpenMood(null)}
          onCopy={handleCopy}
          onSave={handleSave}
          isSaved={isSaved(openMood.message)}
        />
      )}

      {/* Need packs */}
      <section className="animate-[fade-up_0.9s_ease-out]">
        <div className="flex items-center gap-2 mb-3">
          <Pill className="w-4 h-4 text-mint-deep" />
          <h2 className="font-display text-lg">Toa thuốc theo nhu cầu</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {NEED_PACKS.map((p) => (
            <div
              key={p.slug}
              className="glass rounded-2xl p-4 ring-1 ring-white/60 hover:shadow-soft hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{p.emoji}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{p.desc}</p>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full w-full"
                  onClick={() => setOpenPack(p)}
                >
                  Mở toa thuốc
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {openPack && (
        <NeedPackPanel pack={openPack} onClose={() => setOpenPack(null)} onCopy={handleCopy} onSave={handleSave} isSaved={isSaved(openPack.prescription.diagnosis)} />
      )}

      {/* Random comfort */}
      <section className="animate-[fade-up_1s_ease-out]">
        <div className="rounded-3xl bg-gradient-to-br from-mint/20 to-blush/20 p-6 md:p-8 text-center ring-1 ring-white/60">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Bốc một viên thuốc tinh thần
          </div>
          <p
            key={randomNote}
            className="mt-3 font-display text-xl md:text-2xl leading-snug max-w-xl mx-auto animate-[fade-up_0.4s_ease-out]"
          >
            “{randomNote}”
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button onClick={reroll} className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
              <RefreshCw className="w-4 h-4 mr-1.5" /> Kê cho mình một lời nữa
            </Button>
            <Button variant="outline" onClick={() => handleCopy(randomNote)} className="rounded-full">
              <Copy className="w-4 h-4 mr-1.5" /> Sao chép
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(randomNote)}
              className="rounded-full"
            >
              {isSaved(randomNote) ? <Check className="w-4 h-4 mr-1.5" /> : <Heart className="w-4 h-4 mr-1.5" />}
              {isSaved(randomNote) ? "Đã lưu" : "Lưu lại"}
            </Button>
          </div>
        </div>
      </section>

      {/* Mascot note wall */}
      <section className="animate-[fade-up_1.1s_ease-out]">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-mint-deep" />
          <h2 className="font-display text-lg">Góc lời nhắn từ mascot</h2>
        </div>
        <div className="columns-2 md:columns-3 gap-3 [column-fill:_balance]">
          {MASCOT_NOTES.map((n, i) => (
            <div
              key={i}
              className="mb-3 break-inside-avoid rounded-2xl p-4 bg-white/70 ring-1 ring-white/70 shadow-sm hover:shadow-soft hover:-rotate-1 transition-all"
              style={{ background: i % 3 === 0 ? "var(--mint-soft, oklch(0.96 0.02 195))" : i % 3 === 1 ? "oklch(0.95 0.03 195)" : "oklch(0.95 0.03 350)" }}
            >
              <p className="text-sm md:text-[15px] leading-relaxed text-foreground/85 font-display italic">
                “{n}”
              </p>
              <button
                onClick={() => handleSave(n)}
                className="mt-2 text-[11px] text-muted-foreground hover:text-mint-deep inline-flex items-center gap-1"
              >
                {isSaved(n) ? <Check className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
                {isSaved(n) ? "Đã lưu" : "Lưu"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Saved */}
      {saved.length > 0 && (
        <section className="animate-[fade-up_1.2s_ease-out]">
          <h2 className="font-display text-lg mb-3">Toa thuốc đã lưu của bạn</h2>
          <div className="space-y-2">
            {saved.map((t, i) => (
              <div key={i} className="rounded-2xl p-3 bg-white/70 ring-1 ring-white/60 flex gap-3 items-start">
                <Heart className="w-4 h-4 text-mint-deep mt-0.5 flex-shrink-0" />
                <p className="text-sm flex-1 leading-relaxed">{t}</p>
                <button
                  onClick={() => handleSave(t)}
                  className="text-[11px] text-muted-foreground hover:text-blush-deep"
                >
                  Bỏ
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}

function MoodPrescriptionPanel({
  card,
  isSuggested,
  onClose,
  onCopy,
  onSave,
  isSaved,
}: {
  card: MoodCard;
  isSuggested: boolean;
  onClose: () => void;
  onCopy: (t: string) => void;
  onSave: (t: string) => void;
  isSaved: boolean;
}) {
  
  return (
    <div
      className={`rounded-3xl p-6 md:p-7 bg-gradient-to-br ${card.color} ring-1 ring-white/70 animate-[fade-up_0.5s_ease-out]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {isSuggested && (
            <div className="text-[11px] uppercase tracking-wider text-mint-deep mb-1">
              Dựa trên cảm xúc hôm nay của bạn
            </div>
          )}
          <h3 className="font-display text-xl">
            {card.emoji} Đơn thuốc cho “{card.label}”
          </h3>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          Đóng
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Lời nhắn</div>
          <p className="mt-1 font-display text-lg leading-snug">“{card.message}”</p>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Hành động nhỏ</div>
          <p className="mt-1 text-base leading-relaxed">{card.action}</p>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Câu hỏi với chính mình
          </div>
          <p className="mt-1 text-base leading-relaxed italic">{card.question}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => onSave(card.message)}>
          {isSaved ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Heart className="w-3.5 h-3.5 mr-1.5" />}
          {isSaved ? "Đã lưu" : "Lưu lại"}
        </Button>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => onCopy(card.message)}>
          <Copy className="w-3.5 h-3.5 mr-1.5" /> Sao chép
        </Button>
        <Link to="/journal">
          <Button size="sm" variant="outline" className="rounded-full">
            <BookHeart className="w-3.5 h-3.5 mr-1.5" /> Viết vào hồ sơ
          </Button>
        </Link>
        <Link to="/podcast">
          <Button size="sm" variant="outline" className="rounded-full">
            <Headphones className="w-3.5 h-3.5 mr-1.5" /> Nghe mình nhắn
          </Button>
        </Link>
      </div>
    </div>
  );
}

function NeedPackPanel({
  pack,
  onClose,
  onCopy,
  onSave,
  isSaved,
}: {
  pack: NeedPack;
  onClose: () => void;
  onCopy: (t: string) => void;
  onSave: (t: string) => void;
  isSaved: boolean;
}) {
  const text = `${pack.prescription.diagnosis}\n\n${pack.prescription.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
  return (
    <div className="rounded-3xl p-6 md:p-7 glass-strong ring-1 ring-mint/30 animate-[fade-up_0.5s_ease-out]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl">
          {pack.emoji} {pack.title}
        </h3>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          Đóng
        </button>
      </div>
      <p className="mt-3 text-base text-foreground/85 italic">“{pack.prescription.diagnosis}”</p>
      <ol className="mt-4 space-y-3">
        {pack.prescription.steps.map((s, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="mt-0.5 w-6 h-6 rounded-full bg-mint/40 text-mint-deep text-xs font-semibold inline-flex items-center justify-center flex-shrink-0">
              {i + 1}
            </span>
            <span className="text-base leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => onSave(pack.prescription.diagnosis)}>
          {isSaved ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Heart className="w-3.5 h-3.5 mr-1.5" />}
          {isSaved ? "Đã lưu" : "Lưu toa này"}
        </Button>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => onCopy(text)}>
          <Copy className="w-3.5 h-3.5 mr-1.5" /> Sao chép
        </Button>
        <Link to="/">
          <Button size="sm" variant="outline" className="rounded-full">
            <Wind className="w-3.5 h-3.5 mr-1.5" /> Hít thở 1 phút
          </Button>
        </Link>
      </div>
    </div>
  );
}
