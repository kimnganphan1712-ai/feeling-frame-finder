// Static, curated content for "Đơn thuốc tinh thần".
// All copy in Vietnamese, dịu dàng, theo concept "Hospital Playlist".

import type { MoodKey } from "./mood";

export interface DailyPrescription {
  diagnosis: string;
  lines: string[]; // 3 doses
}

export const DAILY_PRESCRIPTIONS: DailyPrescription[] = [
  {
    diagnosis: "Bạn đang mang theo hơi nhiều cảm xúc cùng lúc.",
    lines: [
      "Uống một cốc nước ấm và thở chậm trong một phút.",
      "Tự nhắc mình: “Mình không cần phải ổn ngay lập tức.”",
      "Viết ra một điều đang làm lòng mình nặng nhất.",
    ],
  },
  {
    diagnosis: "Tâm trí đang đầy, trái tim cần một khoảng thở.",
    lines: [
      "Đặt tay lên ngực, đếm 4 nhịp thở vào — 6 nhịp thở ra.",
      "Tạm tắt một thông báo trong điện thoại.",
      "Nhắn cho mình một câu: “Mình đang làm tốt rồi.”",
    ],
  },
  {
    diagnosis: "Bạn đã cố gắng nhiều hơn bạn cho phép mình thừa nhận.",
    lines: [
      "Đứng dậy vươn vai trong 30 giây.",
      "Tự pha cho mình một thứ gì đó ấm.",
      "Viết một dòng biết ơn nhỏ về chính bạn hôm nay.",
    ],
  },
  {
    diagnosis: "Cần được ôm bằng sự dịu dàng.",
    lines: [
      "Mở một bài nhạc bạn yêu trong 3 phút.",
      "Nói thành tiếng: “Mình xứng đáng được nghỉ.”",
      "Gửi một lời hỏi thăm cho một người bạn quan tâm.",
    ],
  },
];

/** Pick today's prescription deterministically by date so it không đổi liên tục trong ngày. */
export function pickDailyPrescription(dateKey: string): DailyPrescription {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  return DAILY_PRESCRIPTIONS[h % DAILY_PRESCRIPTIONS.length];
}

// ----- Mood-based prescriptions -----
export type MoodSlug =
  | "joy"
  | "calm"
  | "sad"
  | "anxious"
  | "angry"
  | "tired"
  | "empty"
  | "grateful";

export interface MoodCard {
  slug: MoodSlug;
  label: string;
  emoji: string;
  color: string; // tailwind bg class
  message: string;
  action: string;
  question: string;
}

export const MOOD_CARDS: MoodCard[] = [
  {
    slug: "joy",
    label: "Vui vẻ",
    emoji: "🌿",
    color: "from-mint/40 to-mint/10",
    message: "Hôm nay ánh sáng trong bạn đang ấm. Hãy giữ nó lại — và để nó lan sang một ai đó nữa nhé.",
    action: "Ghi lại 3 điều nhỏ làm bạn mỉm cười hôm nay.",
    question: "Điều gì hôm nay khiến bạn thấy mình thật sự đang sống?",
  },
  {
    slug: "calm",
    label: "Bình thường",
    emoji: "🌼",
    color: "from-cream/60 to-cream/20",
    message: "Bình thường cũng là một loại hạnh phúc. Một ngày yên ổn là điều đáng biết ơn rồi.",
    action: "Ngồi yên 1 phút, lắng nghe nhịp thở của chính bạn.",
    question: "Có một điều nhỏ nào đang ổn mà bạn quên cảm ơn không?",
  },
  {
    slug: "sad",
    label: "Buồn bã",
    emoji: "💧",
    color: "from-skyblue/40 to-skyblue/10",
    message: "Mình biết hôm nay lòng bạn hơi nặng. Bạn không cần vội làm nó biến mất.",
    action: "Hãy thử ngồi yên 1 phút và đặt tay lên ngực.",
    question: "Điều gì hôm nay khiến bạn dễ tổn thương nhất?",
  },
  {
    slug: "anxious",
    label: "Lo lắng",
    emoji: "🌧️",
    color: "from-blush/40 to-blush/10",
    message: "Lo lắng không có nghĩa là bạn yếu. Nó chỉ nói rằng có điều gì đó quan trọng với bạn.",
    action: "Hít vào 4 nhịp — giữ 4 nhịp — thở ra 6 nhịp. Lặp lại 3 lần.",
    question: "Điều bạn đang lo có chắc chắn sẽ xảy ra không, hay chỉ là “có thể”?",
  },
  {
    slug: "angry",
    label: "Tức giận",
    emoji: "🔥",
    color: "from-blush-deep/30 to-blush/10",
    message: "Bạn được phép giận. Nhưng hãy giận với một trái tim còn nguyên vẹn.",
    action: "Uống một ngụm nước lạnh và đếm chậm từ 1 đến 10.",
    question: "Điều gì bên dưới cơn giận này đang muốn được lắng nghe?",
  },
  {
    slug: "tired",
    label: "Mệt mỏi",
    emoji: "🌙",
    color: "from-mint-deep/20 to-mint/10",
    message: "Cơ thể bạn đang lên tiếng. Nghỉ một chút không phải là lười, đó là tử tế với chính mình.",
    action: "Nhắm mắt 60 giây. Chỉ thở. Không cần làm gì cả.",
    question: "Bạn có thể bớt một việc nào ra khỏi hôm nay không?",
  },
  {
    slug: "empty",
    label: "Trống rỗng",
    emoji: "🌫️",
    color: "from-muted/40 to-muted/10",
    message: "Trống rỗng cũng là một dạng cảm xúc. Bạn không vô cảm — bạn chỉ đang cần một khoảng lặng.",
    action: "Pha một thức uống ấm và uống chậm từng ngụm.",
    question: "Lần cuối bạn cảm thấy mình thật sự kết nối với bản thân là khi nào?",
  },
  {
    slug: "grateful",
    label: "Biết ơn",
    emoji: "✨",
    color: "from-mint/40 to-cream/30",
    message: "Khoảnh khắc biết ơn là khoảnh khắc trái tim mở. Hãy giữ nó lâu hơn một nhịp thở.",
    action: "Viết tên 3 người bạn biết ơn hôm nay — kể cả chính bạn.",
    question: "Bạn muốn giữ lại điều gì từ ngày hôm nay?",
  },
];

export function getMoodCardByKey(mk: MoodKey | null | undefined): MoodCard | null {
  if (!mk) return null;
  const map: Record<MoodKey, MoodSlug> = {
    joy: "joy",
    calm: "calm",
    anger: "angry",
    sad: "sad",
  };
  const slug = map[mk];
  return MOOD_CARDS.find((m) => m.slug === slug) ?? null;
}

// ----- Need-based prescription packs -----
export interface NeedPack {
  slug: string;
  title: string;
  desc: string;
  emoji: string;
  prescription: {
    diagnosis: string;
    steps: string[];
  };
}

export const NEED_PACKS: NeedPack[] = [
  {
    slug: "overwhelmed",
    title: "Khi quá tải",
    desc: "Khi mọi thứ ập đến cùng một lúc.",
    emoji: "🌊",
    prescription: {
      diagnosis: "Hệ thần kinh đang đầy. Bạn cần một khoảng trắng.",
      steps: [
        "Tạm dừng tất cả việc đang làm trong 2 phút.",
        "Viết ra 3 việc — chọn 1 việc nhỏ nhất để làm trước.",
        "Cho phép phần còn lại được đợi.",
      ],
    },
  },
  {
    slug: "unmotivated",
    title: "Khi mất động lực",
    desc: "Khi cái gì cũng thấy nặng.",
    emoji: "🍃",
    prescription: {
      diagnosis: "Bạn không lười. Bạn chỉ đang cạn pin.",
      steps: [
        "Làm một việc nhỏ tới mức không thể từ chối — 2 phút thôi.",
        "Khen mình ngay sau khi làm.",
        "Nghỉ thật, không phải nghỉ kèm thấy tội lỗi.",
      ],
    },
  },
  {
    slug: "lonely",
    title: "Khi cô đơn",
    desc: "Khi xung quanh đông người mà lòng vẫn vắng.",
    emoji: "🫂",
    prescription: {
      diagnosis: "Bạn đang khao khát được nhìn thấy.",
      steps: [
        "Nhắn cho một người: “Tự nhiên nhớ bạn.”",
        "Đặt tay lên ngực, nói: “Mình ở đây với mình.”",
        "Mở một bản nhạc bạn nghe khi còn nhỏ.",
      ],
    },
  },
  {
    slug: "sleep",
    title: "Khi cần ngủ ngon hơn",
    desc: "Khi đầu vẫn quay khi mắt đã mỏi.",
    emoji: "🌙",
    prescription: {
      diagnosis: "Tâm trí bạn chưa được tiễn ngày cũ về.",
      steps: [
        "Viết ra 3 việc của hôm nay — kể cả việc rất nhỏ.",
        "Tắt đèn, thở 4-7-8 trong 4 nhịp.",
        "Nói thầm: “Mình đã làm đủ cho hôm nay.”",
      ],
    },
  },
  {
    slug: "lighten",
    title: "Khi muốn nhẹ lòng",
    desc: "Khi muốn bỏ bớt một điều gì đó.",
    emoji: "🪶",
    prescription: {
      diagnosis: "Có một điều bạn đang giữ quá lâu.",
      steps: [
        "Viết nó ra — không cần ai đọc.",
        "Đọc lại một lần, rồi xếp lại.",
        "Đi bộ chậm 5 phút, để cơ thể tiêu hoá nó cùng bạn.",
      ],
    },
  },
  {
    slug: "encourage",
    title: "Khi cần được động viên",
    desc: "Khi bạn quên rằng mình đang cố gắng.",
    emoji: "🌟",
    prescription: {
      diagnosis: "Bạn đang quên ghi nhận chính mình.",
      steps: [
        "Liệt kê 3 điều bạn đã vượt qua tháng này.",
        "Tự nói với mình: “Mình tự hào về bạn.”",
        "Mặc một thứ làm bạn thấy đẹp hôm nay.",
      ],
    },
  },
  {
    slug: "comeback",
    title: "Khi muốn quay về với bản thân",
    desc: "Khi cảm thấy mình đã đi quá xa khỏi mình.",
    emoji: "🌱",
    prescription: {
      diagnosis: "Bạn đang cần một cuộc hẹn với chính mình.",
      steps: [
        "Ngồi yên 5 phút, không điện thoại.",
        "Hỏi: “Hôm nay mình thật sự đang cần gì?”",
        "Chọn một việc nhỏ chỉ vì bạn muốn — không vì ai cả.",
      ],
    },
  },
];

// ----- Mascot wall notes -----
export const MASCOT_NOTES: string[] = [
  "Hôm nay không cần hoàn hảo, chỉ cần dịu với mình hơn một chút.",
  "Bạn không cần làm hết mọi thứ mới được nghỉ.",
  "Mình tự hào vì bạn vẫn đang cố gắng.",
  "Cảm xúc nào của bạn cũng xứng đáng được lắng nghe.",
  "Một ngày khó không định nghĩa cả bạn.",
  "Bạn được phép chậm lại. Mình ở đây.",
  "Nỗi buồn rồi cũng sẽ tan, như sương sớm.",
  "Bạn đã đi xa hơn bạn nghĩ rất nhiều.",
  "Hôm nay thở thôi cũng là một thành tựu.",
  "Bạn không một mình. Mình vẫn ở trạm, đợi bạn.",
  "Có những ngày chỉ cần tồn tại đã là đủ.",
  "Mình thương bạn — kể cả phần bạn chưa thương được.",
];

export function pickRandomNote(exclude?: string): string {
  const pool = exclude ? MASCOT_NOTES.filter((n) => n !== exclude) : MASCOT_NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ----- Saved (favorites) — localStorage -----
const SAVED_KEY = "tramdiu:prescription-saved";

export function listSavedNotes(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function toggleSavedNote(text: string): string[] {
  const cur = listSavedNotes();
  const next = cur.includes(text) ? cur.filter((n) => n !== text) : [text, ...cur];
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
