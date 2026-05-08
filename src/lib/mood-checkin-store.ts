import { supabase } from "@/integrations/supabase/client";
import { localDateKey } from "@/lib/utils";

export interface MoodCheckin {
  id: string;
  user_id: string;
  username: string;
  adjective: string;
  sticker_type: string;
  sticker_color: string;
  entry_date: string;
  is_public: boolean;
  note_private?: string | null;
  created_at: string;
}

// Light profanity filter (Vietnamese + English basics).
// This is intentionally conservative — admin can still moderate.
const BLOCKED = [
  "địt", "đụ", "đm", "dmm", "vcl", "đéo", "lồn", "cặc", "buồi",
  "fuck", "shit", "bitch", "cunt", "asshole", "dick",
];

export function checkAdjective(raw: string): { ok: boolean; value: string; error?: string } {
  const value = raw.trim();
  if (value.length < 1) return { ok: false, value, error: "Bạn hãy viết một tính từ trước nha." };
  if (value.length > 20) return { ok: false, value, error: "Chỉ cần một tính từ ngắn thôi nhé." };
  if (/[\n\r]/.test(value)) return { ok: false, value, error: "Chỉ cần một tính từ ngắn thôi nhé." };
  const lower = value.toLowerCase();
  if (BLOCKED.some((b) => lower.includes(b))) {
    return { ok: false, value, error: "Từ này chưa phù hợp để public. Bạn thử chọn một từ dịu dàng hơn nhé." };
  }
  return { ok: true, value };
}

export const moodCheckinStore = {
  async getToday(userId: string): Promise<MoodCheckin | null> {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("mood_checkins")
      .select("*")
      .eq("user_id", userId)
      .eq("entry_date", today)
      .maybeSingle();
    return (data as MoodCheckin) ?? null;
  },

  async submit(payload: {
    user_id: string;
    username: string;
    adjective: string;
    sticker_type: string;
    sticker_color: string;
  }): Promise<{ data?: MoodCheckin; error?: string }> {
    const { data, error } = await supabase
      .from("mood_checkins")
      .insert(payload)
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { data: data as MoodCheckin };
  },

  async listRecentPublic(limit = 60): Promise<MoodCheckin[]> {
    const { data } = await supabase
      .from("mood_checkins")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as MoodCheckin[];
  },

  async listMine(userId: string): Promise<MoodCheckin[]> {
    const { data } = await supabase
      .from("mood_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: true });
    return (data ?? []) as MoodCheckin[];
  },

  async updateNote(id: string, note: string): Promise<{ error?: string }> {
    const { error } = await supabase
      .from("mood_checkins")
      .update({ note_private: note })
      .eq("id", id);
    if (error) return { error: error.message };
    return {};
  },

  async deleteOne(id: string): Promise<{ error?: string }> {
    const { error } = await supabase.from("mood_checkins").delete().eq("id", id);
    if (error) return { error: error.message };
    return {};
  },
};
