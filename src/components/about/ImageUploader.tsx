import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { projectPageStore } from "@/lib/project-page-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
  aspect?: "square" | "video" | "portrait" | "wide";
  className?: string;
}

const aspectMap = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[16/7]",
};

export function ImageUploader({
  value,
  onChange,
  folder = "misc",
  label = "Tải ảnh lên",
  aspect = "video",
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ảnh quá lớn (tối đa 8MB)");
      return;
    }
    try {
      setBusy(true);
      const url = await projectPageStore.uploadImage(file, folder);
      onChange(url);
      toast.success("Đã tải ảnh lên");
    } catch (e) {
      toast.error("Không tải ảnh được");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden border-2 border-dashed border-mint/40 bg-mint/5 group",
          aspectMap[aspect],
        )}
      >
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2 p-3 text-center">
            <ImageIcon className="w-8 h-8 opacity-60" />
            <p className="text-xs">{label}</p>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-mint-deep" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload className="w-3 h-3 mr-1" /> {value ? "Đổi ảnh" : "Chọn ảnh"}
        </Button>
        {value && (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value || null)}
            className="flex-1 text-[11px] px-2 py-1 rounded-full bg-white/70 border border-mint/30 truncate"
          />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
