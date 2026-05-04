import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, X, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  preview: string;
  onSave: (params: { intervalKind: "once" | "daily" | "monthly"; deliverAt: string }) => Promise<void>;
}

export function TimeCapsuleDialog({ open, onClose, preview, onSave }: Props) {
  const [interval_, setInterval_] = useState<"once" | "daily" | "monthly">("once");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [date, setDate] = useState(tomorrow.toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    await onSave({ intervalKind: interval_, deliverAt: date });
    setSaving(false);
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-up_0.3s_ease-out]">
      <div className="glass-strong rounded-3xl shadow-soft max-w-md w-full p-6 relative border border-white/60">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="Đóng">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-10 h-10 rounded-xl bg-blush/40 flex items-center justify-center text-blush-deep">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Viên nang thời gian</h2>
            <p className="text-xs text-muted-foreground">Gửi cho phiên bản tương lai của bạn 💌</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-muted-foreground">Tần suất gửi</label>
          <div className="flex gap-2 mt-1">
            {([["once", "Một lần"], ["monthly", "Hàng tháng"], ["daily", "Hàng ngày"]] as const).map(([v, lbl]) => (
              <button
                key={v}
                onClick={() => setInterval_(v)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  interval_ === v ? "bg-mint-deep text-white" : "bg-muted hover:bg-mint/30",
                )}
              >{lbl}</button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <label className="text-xs text-muted-foreground">Ngày nhận</label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl bg-white/70 text-sm outline-none focus:ring-2 focus:ring-mint-deep/40"
          />
        </div>

        <div className="mt-4 p-3 rounded-2xl bg-blush/20 border border-blush/30 max-h-[120px] overflow-hidden relative">
          <p className="text-xs uppercase tracking-widest text-blush-deep mb-1">Xem trước</p>
          <div className="text-sm text-foreground/80 line-clamp-3" dangerouslySetInnerHTML={{ __html: preview || "<i>(Bạn chưa viết gì)</i>" }} />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || done}
          className="mt-5 w-full rounded-full bg-blush-deep hover:bg-blush-deep/90 text-white"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {done && <Check className="w-4 h-4 mr-2" />}
          {done ? "Đã niêm phong 🌿" : "Niêm phong viên nang"}
        </Button>
      </div>
    </div>
  );
}
