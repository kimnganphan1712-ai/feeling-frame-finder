import defaultImg from "@/assets/mascot-default.png";
import questionImg from "@/assets/mascot-question.png";
import happyImg from "@/assets/mascot-happy.png";
import comfortImg from "@/assets/mascot-comfort.png";
import encourageImg from "@/assets/mascot-encourage.png";
import ideaImg from "@/assets/mascot-idea.png";
import sorryImg from "@/assets/mascot-sorry.png";
import loadingImg from "@/assets/mascot-loading.png";
import { cn } from "@/lib/utils";

export type MascotVariant =
  | "default"
  | "question"
  | "happy"
  | "comfort"
  | "encourage"
  | "idea"
  | "sorry"
  | "loading";

const VARIANT_MAP: Record<MascotVariant, string> = {
  default: defaultImg,
  question: questionImg,
  happy: happyImg,
  comfort: comfortImg,
  encourage: encourageImg,
  idea: ideaImg,
  sorry: sorryImg,
  loading: loadingImg,
};

const VARIANT_ALT: Record<MascotVariant, string> = {
  default: "Mascot Hospital Playlist chào bạn",
  question: "Mascot đang hỏi cảm xúc của bạn",
  happy: "Mascot vui mừng chúc mừng bạn",
  comfort: "Mascot đang an ủi bạn",
  encourage: "Mascot đang động viên bạn",
  idea: "Mascot đang gợi ý cho bạn",
  sorry: "Mascot xin lỗi - chưa có nội dung",
  loading: "Mascot đang chờ cùng bạn",
};

interface MascotProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: MascotVariant;
  className?: string;
  floating?: boolean;
  glow?: boolean;
}

const sizeMap = {
  xs: "w-12 h-12",
  sm: "w-20 h-20",
  md: "w-32 h-32",
  lg: "w-48 h-48",
  xl: "w-64 h-64",
};

export function Mascot({
  size = "md",
  variant = "default",
  className,
  floating = false,
  glow = false,
}: MascotProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        sizeMap[size],
        floating && "animate-float",
        className,
      )}
    >
      {glow && <div className="absolute inset-0 bg-gradient-mascot blur-2xl scale-125" />}
      <img
        src={VARIANT_MAP[variant]}
        alt={VARIANT_ALT[variant]}
        className="relative w-full h-full object-contain drop-shadow-md select-none"
        draggable={false}
      />
    </div>
  );
}

/** Map a mood key to the most appropriate mascot variant. */
export function moodToMascot(moodKey?: string | null): MascotVariant {
  switch (moodKey) {
    case "happy":
    case "calm":
      return "happy";
    case "sad":
    case "tired":
    case "lonely":
      return "comfort";
    case "anxious":
    case "stressed":
      return "encourage";
    default:
      return "default";
  }
}
