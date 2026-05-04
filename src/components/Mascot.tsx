import mascotImg from "@/assets/mascot.png";
import { cn } from "@/lib/utils";

interface MascotProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
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

export function Mascot({ size = "md", className, floating = false, glow = false }: MascotProps) {
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
        src={mascotImg}
        alt="Mascot Trạm Dịu"
        className="relative w-full h-full object-contain drop-shadow-md select-none"
        draggable={false}
      />
    </div>
  );
}
