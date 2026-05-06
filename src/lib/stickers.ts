// Sticker palette for mood check-ins (matches the public mood board)
export interface StickerOption {
  type: string;
  label: string;
  color: string; // background color (hex)
  face: "smile" | "calm" | "soft" | "stress" | "worry" | "blank" | "special";
}

export const STICKERS: StickerOption[] = [
  { type: "happy_yellow", label: "Vui vẻ", color: "#F5D04A", face: "smile" },
  { type: "calm_green", label: "Bình yên", color: "#7FC79B", face: "calm" },
  { type: "grateful_pink", label: "Biết ơn", color: "#F4B6C2", face: "soft" },
  { type: "stress_red", label: "Căng thẳng", color: "#E27373", face: "stress" },
  { type: "worry_purple", label: "Lo lắng", color: "#B7A4D6", face: "worry" },
  { type: "empty_gray", label: "Trống rỗng", color: "#A8B5B5", face: "blank" },
  { type: "special_blue", label: "Khó gọi tên", color: "#3F6FA8", face: "special" },
];

export function getSticker(type: string | null | undefined): StickerOption | null {
  if (!type) return null;
  return STICKERS.find((s) => s.type === type) ?? null;
}
