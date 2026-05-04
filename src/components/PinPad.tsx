import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface PinPadHandle {
  reset: () => void;
  shake: () => void;
}

interface PinPadProps {
  onComplete: (pin: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const PinPad = forwardRef<PinPadHandle, PinPadProps>(function PinPad(
  { onComplete, disabled, autoFocus = true },
  ref,
) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [shaking, setShaking] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    },
    shake: () => {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    },
  }));

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  const setAt = (i: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      if (v && i < 5) inputs.current[i + 1]?.focus();
      const joined = next.join("");
      if (joined.length === 6 && next.every((d) => d !== "")) {
        setTimeout(() => onComplete(joined), 80);
      }
      return next;
    });
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < 5) inputs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!txt) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < txt.length; i++) next[i] = txt[i];
    setDigits(next);
    if (txt.length === 6) setTimeout(() => onComplete(txt), 80);
    else inputs.current[txt.length]?.focus();
  };

  return (
    <div className={cn("flex justify-center gap-2 sm:gap-3", shaking && "animate-shake")}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={d}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
          className={cn(
            "w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-semibold rounded-2xl",
            "bg-white/80 border-2 border-white outline-none",
            "transition-all duration-200",
            "focus:border-mint-deep focus:shadow-[0_0_0_4px_color-mix(in_oklch,var(--mint-deep)_25%,transparent)] focus:scale-[1.04]",
            d && "bg-mint/20 border-mint-deep/40",
          )}
        />
      ))}
    </div>
  );
});
