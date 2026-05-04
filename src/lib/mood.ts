export type MoodKey = "joy" | "calm" | "anger" | "sad";

export interface Mood {
  key: MoodKey;
  label: string;
  emoji: string;
  colorVar: string;
  description: string;
}

export const MOODS: Mood[] = [
  { key: "joy", label: "Vui vẻ", emoji: "🌿", colorVar: "var(--mood-joy)", description: "Hạnh phúc, tươi mới" },
  { key: "calm", label: "Bình thường", emoji: "🌼", colorVar: "var(--mood-calm)", description: "Ổn định, vừa đủ" },
  { key: "anger", label: "Tức giận", emoji: "🔥", colorVar: "var(--mood-anger)", description: "Khó chịu, bực dọc" },
  { key: "sad", label: "Buồn bã", emoji: "💧", colorVar: "var(--mood-sad)", description: "Thất vọng, nặng lòng" },
];

const MESSAGES: Record<MoodKey, string[]> = {
  joy: [
    "Hôm nay ánh sáng trong bạn đang rất ấm. Hãy giữ lấy cảm giác này — và để nó lan sang một ai đó nữa nhé.",
    "Niềm vui của bạn xứng đáng được đặt tên. Ghi lại một dòng hôm nay, để sau này đọc lại sẽ thấy mình đã từng nhẹ nhàng đến vậy.",
  ],
  calm: [
    "Bình thường cũng là một loại hạnh phúc. Không có sóng gió hôm nay đã là điều đáng biết ơn rồi.",
    "Một ngày yên ổn thường bị xem nhẹ. Nhưng chính những ngày như thế này lại nuôi mình lớn lên.",
  ],
  anger: [
    "Cơn giận không phải là kẻ thù — nó là tín hiệu rằng có điều gì đó quan trọng với bạn đang bị tổn thương. Hít một hơi thật sâu, mình ngồi với nó một lát nhé.",
    "Bạn được phép giận. Nhưng hãy giận với một trái tim còn nguyên vẹn, đừng để nó nuốt mất sự dịu dàng vốn có của bạn.",
  ],
  sad: [
    "Có những ngày nặng hơn ngày khác — và điều đó hoàn toàn ổn. Bạn không cần phải vui ngay bây giờ. Chỉ cần ở lại đây với mình một chút thôi.",
    "Nỗi buồn không làm bạn yếu đuối. Nó chỉ chứng minh bạn còn cảm nhận được. Mình ở đây, lặng lẽ bên bạn.",
  ],
};

export function getMoodMessage(mood: MoodKey): string {
  const arr = MESSAGES[mood];
  return arr[Math.floor(Math.random() * arr.length)];
}
