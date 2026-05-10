import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface LightboxImage {
  url: string;
  alt?: string;
  caption?: string;
}

interface Props {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}

export function Lightbox({ images, index, onClose, onIndex }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onIndex]);

  if (index < 0 || index >= images.length) return null;
  const img = images[index];

  return (
    <div
      className="fixed inset-0 z-[100] bg-navy/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-up_0.25s_ease-out]"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        aria-label="Đóng"
      >
        <X className="w-5 h-5" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index - 1 + images.length) % images.length);
            }}
            className="absolute left-3 sm:left-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Trước"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index + 1) % images.length);
            }}
            className="absolute right-3 sm:right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Tiếp"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <figure
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl max-h-[85vh] w-full"
      >
        <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-cinematic bg-navy/40">
          <img
            src={img.url}
            alt={img.alt ?? ""}
            className="w-full max-h-[80vh] object-contain"
          />
        </div>
        {img.caption && (
          <figcaption className="mt-3 text-center text-white/80 font-display italic text-sm sm:text-base">
            {img.caption}
          </figcaption>
        )}
        <p className="mt-1 text-center text-white/40 text-[11px]">
          {index + 1} / {images.length}
        </p>
      </figure>
    </div>
  );
}
