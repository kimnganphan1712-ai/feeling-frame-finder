import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/Mascot";
import { BookHeart, Headphones, Heart, RefreshCw, Sparkles, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { logEmotionCornerEvent } from "@/lib/emotion-corner-analytics";

export interface EmotionCorner {
  key: string;
  emoji: string;
  title: string;
  desc: string;
  modalTitle: string;
  message: string;
  quotes: string[];
  suggestion: string;
  ctas: Array<
    | { kind: "link"; label: string; to: string; icon?: "journal" | "podcast" | "vitamin" | "breath" }
    | { kind: "random"; label: string }
  >;
  mascot?: "comfort" | "happy" | "encourage" | "default";
}

const ICONS: Record<string, LucideIcon> = {
  journal: BookHeart,
  podcast: Headphones,
  vitamin: Sparkles,
  breath: Wind,
};

interface Props {
  corner: EmotionCorner | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function EmotionCornerDialog({ corner, open, onOpenChange }: Props) {
  const [seed, setSeed] = useState(0);
  const message = useMemo(() => {
    if (!corner) return "";
    if (corner.quotes.length === 0) return corner.message;
    const idx = seed % corner.quotes.length;
    return corner.quotes[idx];
  }, [corner, seed]);

  if (!corner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[2rem] border-0 ring-1 ring-white/60 bg-gradient-to-br from-white via-mint/10 to-blush/10 shadow-[0_20px_60px_-20px_rgba(80,120,140,0.25)] p-0 overflow-hidden">
        <div className="px-7 pt-7 pb-2 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/70 border border-white/70 flex items-center justify-center text-3xl shadow-sm">
            {corner.emoji}
          </div>
          <DialogHeader className="mt-4 space-y-1">
            <DialogTitle className="font-display text-xl md:text-2xl text-foreground/90">
              {corner.modalTitle}
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-[0.25em] text-mint-deep/80">
              góc trú ẩn nhỏ
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-7 pb-2 space-y-4">
          <p className="text-sm md:text-[15px] text-foreground/85 leading-relaxed text-center italic">
            “{message}”
          </p>

          <div className="rounded-2xl bg-white/70 border border-white/70 p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-mint-deep/80 mb-1.5">Gợi ý nhỏ hôm nay</p>
            <p className="text-sm text-foreground/85 leading-relaxed">{corner.suggestion}</p>
          </div>

          {corner.mascot && (
            <div className="flex justify-center pt-1">
              <Mascot size="sm" variant={corner.mascot} floating />
            </div>
          )}
        </div>

        <div className="px-7 pb-7 pt-4 flex flex-wrap items-center justify-center gap-2">
          {corner.ctas.map((cta, i) => {
            if (cta.kind === "random") {
              return (
                <Button
                  key={i}
                  size="sm"
                  variant="outline"
                  onClick={() => setSeed((s) => s + 1)}
                  className="rounded-full"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  {cta.label}
                </Button>
              );
            }
            const Icon = cta.icon ? ICONS[cta.icon] ?? Heart : Heart;
            const primary = i === 0;
            return (
              <Link key={i} to={cta.to as "/journal"} onClick={() => onOpenChange(false)}>
                <Button
                  size="sm"
                  className={
                    primary
                      ? "rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white"
                      : "rounded-full"
                  }
                  variant={primary ? "default" : "outline"}
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  {cta.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const EMOTION_CORNERS: EmotionCorner[] = [
  {
    key: "lonely",
    emoji: "🌙",
    title: "Khi bạn thấy cô đơn",
    desc: "Cho những đêm dài lặng tiếng.",
    modalTitle: "Góc dành cho những ngày cô đơn",
    message:
      "Có những ngày mình ở giữa rất nhiều người nhưng vẫn thấy lòng trống rỗng. Cảm giác cô đơn không làm bạn yếu đuối — nó chỉ đang nhắc rằng bạn cũng cần được kết nối và được ôm ấp.",
    quotes: [
      "Bạn không phải đi qua cảm xúc này một mình. Có rất nhiều người cũng đang lặng lẽ thở giống bạn.",
      "Cô đơn không phải là dấu hiệu bạn thiếu điều gì. Đôi khi nó chỉ là khoảng lặng để bạn nghe thấy chính mình.",
      "Bạn xứng đáng được lắng nghe — kể cả khi bạn chưa biết bắt đầu kể từ đâu.",
    ],
    suggestion: "Hãy viết ra tên một người bạn muốn nhắn tin, hoặc đặt tay lên tim và thở chậm trong 30 giây.",
    mascot: "comfort",
    ctas: [
      { kind: "link", label: "Viết vào nhật ký", to: "/journal", icon: "journal" },
      { kind: "link", label: "Nghe một tần số dịu", to: "/podcast", icon: "podcast" },
      { kind: "random", label: "Lời nhắn khác" },
    ],
  },
  {
    key: "sleep",
    emoji: "🌿",
    title: "Khi bạn cần ngủ ngon",
    desc: "Tiếng thở của một giấc dịu.",
    modalTitle: "Góc cho một giấc ngủ dịu",
    message:
      "Hôm nay bạn đã đi qua nhiều rồi. Cho phép mình được dừng lại, đặt mọi suy nghĩ xuống, và để giấc ngủ ôm bạn một chút.",
    quotes: [
      "Đêm nay bạn không cần phải giải quyết tất cả. Hãy để ngày mai làm phần việc của ngày mai.",
      "Hơi thở của bạn là một bài hát ru. Hãy nghe nó một lát thôi.",
      "Bạn không cần xứng đáng để được nghỉ ngơi. Bạn chỉ cần là bạn.",
    ],
    suggestion: "Thử bài thở 4–7–8: hít vào 4 nhịp, giữ 7 nhịp, thở ra 8 nhịp — lặp lại 3 vòng trước khi ngủ.",
    mascot: "default",
    ctas: [
      { kind: "link", label: "Nghe podcast ngủ ngon", to: "/podcast", icon: "podcast" },
      { kind: "link", label: "Bài thở 3 phút", to: "/mood", icon: "breath" },
      { kind: "random", label: "Lời nhắn khác" },
    ],
  },
  {
    key: "missing",
    emoji: "🤍",
    title: "Khi bạn nhớ một người",
    desc: "Một chỗ để giữ nỗi nhớ ấm.",
    modalTitle: "Góc cho nỗi nhớ",
    message:
      "Nỗi nhớ là cách trái tim mình nói rằng người ấy đã thật sự quan trọng. Bạn không cần phải vội buông — chỉ cần để nỗi nhớ được ngồi xuống cạnh mình một lát.",
    quotes: [
      "Có những người mình không gặp lại nữa, nhưng vẫn ở trong cách mình yêu thương người khác.",
      "Nhớ ai đó không có nghĩa là bạn yếu lòng. Nó chỉ có nghĩa là bạn từng yêu thương rất thật.",
      "Hãy viết ra điều bạn muốn nói — kể cả khi bạn không gửi đi.",
    ],
    suggestion: "Viết một lá thư ngắn — một postcard không cần gửi — cho người mà bạn đang nhớ.",
    mascot: "comfort",
    ctas: [
      { kind: "link", label: "Viết postcard", to: "/journal", icon: "journal" },
      { kind: "link", label: "Lưu lời nhắn", to: "/vitamin", icon: "vitamin" },
      { kind: "random", label: "Lời nhắn khác" },
    ],
  },
  {
    key: "restart",
    emoji: "🌱",
    title: "Khi bạn muốn bắt đầu lại",
    desc: "Bắt đầu nhỏ thôi cũng được.",
    modalTitle: "Góc bắt đầu lại",
    message:
      "Không có sự bắt đầu nào là quá nhỏ. Một hơi thở sâu, một dòng nhật ký, một lời hứa nhỏ với chính mình — đó đã là một khởi đầu.",
    quotes: [
      "Bạn được phép viết lại câu chuyện của mình bất cứ lúc nào.",
      "Hôm nay là một trang trắng. Bạn không cần biết phải viết gì — chỉ cần bắt đầu.",
      "Mỗi bước nhỏ vẫn đang đưa bạn về gần hơn với chính mình.",
    ],
    suggestion: "Viết ra một lời hứa rất nhỏ với bản thân cho ngày mai — nhỏ đến mức chắc chắn bạn làm được.",
    mascot: "happy",
    ctas: [
      { kind: "link", label: "Viết vào nhật ký", to: "/journal", icon: "journal" },
      { kind: "link", label: "Đơn thuốc hôm nay", to: "/prescription", icon: "vitamin" },
      { kind: "random", label: "Lời nhắn khác" },
    ],
  },
  {
    key: "enough",
    emoji: "🪷",
    title: "Khi bạn thấy mình không đủ tốt",
    desc: "Bạn đã đủ, từ lúc bạn ở đây.",
    modalTitle: "Góc ôm lấy chính mình",
    message:
      "Bạn không phải là tổng của những điều bạn chưa làm được. Bạn đã đi qua rất nhiều ngày khó để có mặt ở đây hôm nay — và điều đó đã đủ rồi.",
    quotes: [
      "Bạn xứng đáng được dịu dàng, kể cả khi bạn chưa hoàn hảo.",
      "Việc bạn vẫn đang cố gắng — đó đã là một loại can đảm rồi.",
      "Đừng so sánh chương đầu của mình với chương giữa của người khác.",
    ],
    suggestion: "Viết ra 3 điều bạn đã làm được hôm nay — dù nhỏ đến đâu cũng được tính.",
    mascot: "encourage",
    ctas: [
      { kind: "link", label: "Lưu vào album", to: "/vitamin", icon: "vitamin" },
      { kind: "link", label: "Viết vào nhật ký", to: "/journal", icon: "journal" },
      { kind: "random", label: "Lời nhắn khác" },
    ],
  },
  {
    key: "hug",
    emoji: "🫧",
    title: "Khi bạn cần một cái ôm tinh thần",
    desc: "Một vòng tay vô hình, gửi bạn.",
    modalTitle: "Một cái ôm tinh thần gửi bạn",
    message:
      "Đặt tay lên ngực mình một chút. Hít vào thật sâu. Tưởng tượng có một vòng tay nhẹ nhàng đang ôm lấy bạn từ phía sau — và nó đang nói: ổn rồi, bạn không phải gồng nữa đâu.",
    quotes: [
      "Bạn không cần lý do để được ôm. Cảm xúc của bạn đã là lý do rồi.",
      "Hãy ôm chính mình như cách bạn vẫn ôm những người mình thương.",
      "Cái ôm này gửi bạn — không kèm điều kiện nào hết.",
    ],
    suggestion: "Khoanh tay ôm lấy hai vai mình, vỗ nhẹ vài cái như đang dỗ một người bạn thân.",
    mascot: "comfort",
    ctas: [
      { kind: "random", label: "Nhận một cái ôm khác" },
      { kind: "link", label: "Viết vào nhật ký", to: "/journal", icon: "journal" },
      { kind: "link", label: "Nghe tần số dịu", to: "/podcast", icon: "podcast" },
    ],
  },
];
