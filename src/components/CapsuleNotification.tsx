import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { cloudStore, CapsuleDelivery } from "@/lib/cloud-store";
import { Mail, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CapsuleNotification() {
  const { user } = useAuth();
  const [list, setList] = useState<CapsuleDelivery[]>([]);
  const [active, setActive] = useState<CapsuleDelivery | null>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!user) return;
    cloudStore.getDueCapsules(user.id).then((arr) => {
      if (arr.length > 0) {
        setList(arr);
        setActive(arr[0]);
      }
    });
  }, [user]);

  if (!active) return null;

  const close = async () => {
    if (user) await cloudStore.markCapsuleRead(user.id, active.id);
    const rest = list.filter((c) => c.id !== active.id);
    setList(rest);
    setActive(rest[0] ?? null);
    setOpened(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-up_0.5s_ease-out]">
      <div className="relative max-w-md w-full">
        {!opened ? (
          <div
            onClick={() => setOpened(true)}
            className="cursor-pointer glass-strong rounded-3xl p-8 text-center shadow-soft border border-white/60 hover:scale-[1.02] transition-transform"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-mascot blur-2xl scale-150 opacity-60" />
              <div className="relative w-20 h-20 mx-auto rounded-2xl bg-blush/40 flex items-center justify-center text-blush-deep animate-[float_3s_ease-in-out_infinite]">
                <Mail className="w-10 h-10" />
              </div>
            </div>
            <p className="mt-5 text-xs uppercase tracking-widest text-blush-deep flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> Một lời nhắn từ quá khứ
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Bạn có một viên nang để mở 💌</h2>
            <p className="mt-2 text-sm text-muted-foreground">Bấm để mở phong thư</p>
          </div>
        ) : (
          <div className="glass-strong rounded-3xl p-7 shadow-soft border border-white/60 animate-[fade-up_0.5s_ease-out]">
            <button onClick={close} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="Đóng">
              <X className="w-5 h-5" />
            </button>
            <p className="text-xs uppercase tracking-widest text-blush-deep">Viên nang thời gian</p>
            <h2 className="text-xl font-semibold mt-1">{active.entry?.title || "Một lời nhắn cho bạn"}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Viết ngày {active.entry ? new Date(active.entry.created_at).toLocaleDateString("vi-VN") : ""}
            </p>
            <div
              className="mt-4 max-h-[50vh] overflow-y-auto text-sm leading-relaxed text-foreground/85 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: active.entry?.body || "" }}
            />
            <Button onClick={close} className="mt-5 w-full rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
              Cảm ơn mình của ngày trước
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
