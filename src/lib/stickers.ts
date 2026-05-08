// Sticker palette for mood check-ins (matches the public mood board)
export type StickerFace =
  | "joy"
  | "calm"
  | "grateful"
  | "sad"
  | "tired"
  | "anxious"
  | "angry"
  | "empty"
  | "stressed"
  | "hopeful";

export interface StickerOption {
  type: string;
  label: string;
  color: string; // background color (hex)
  face: StickerFace;
  /** Short, gentle reaction line shown when this sticker is picked. */
  reaction: string;
}

export const STICKERS: StickerOption[] = [
  { type: "happy_yellow",     label: "Vui vẻ",     color: "#F7D86B", face: "joy",       reaction: "Trạm nghe thấy niềm vui của bạn rồi." },
  { type: "calm_green",       label: "Bình yên",   color: "#A8DFC1", face: "calm",      reaction: "Một khoảng bình yên thật quý — giữ nó lâu một chút nhé." },
  { type: "grateful_pink",    label: "Biết ơn",    color: "#F6BFCE", face: "grateful",  reaction: "Lòng biết ơn của bạn dịu dàng quá." },
  { type: "sad_purple",       label: "Buồn",       color: "#C9B8E6", face: "sad",       reaction: "Buồn cũng được phép tồn tại ở đây." },
  { type: "tired_blue",       label: "Mệt",        color: "#B6CDEA", face: "tired",     reaction: "Hôm nay bạn có vẻ hơi mệt nhỉ. Nghỉ một chút nha." },
  { type: "worry_purple",     label: "Lo âu",      color: "#BCB3E3", face: "anxious",   reaction: "Trạm sẽ ngồi cạnh bạn đến khi lo âu dịu lại." },
  { type: "angry_coral",      label: "Giận",       color: "#F1A29A", face: "angry",     reaction: "Cơn giận này có lý do của nó. Mình thở chậm một nhịp nhé." },
  { type: "empty_gray",       label: "Trống rỗng", color: "#BFC9CC", face: "empty",     reaction: "Trống rỗng cũng là một cảm xúc — không sao cả." },
  { type: "stress_peach",     label: "Căng thẳng", color: "#F4C4A1", face: "stressed",  reaction: "Bạn đang gồng nhiều đó. Trạm ở đây rồi." },
  { type: "hopeful_teal",     label: "Hy vọng",    color: "#9FD9D2", face: "hopeful",   reaction: "Một tia hy vọng nhỏ cũng đủ để hôm nay sáng hơn." },
];

export function getSticker(type: string | null | undefined): StickerOption | null {
  if (!type) return null;
  return STICKERS.find((s) => s.type === type) ?? null;
}
