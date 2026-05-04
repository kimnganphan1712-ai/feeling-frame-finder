// Cloud-backed store for Trạm Dịu (per-user via Supabase RLS)
import { supabase } from "@/integrations/supabase/client";
import { MoodKey } from "./mood";

export interface MoodEntry {
  date: string;
  mood: MoodKey;
}

export interface JournalEntry {
  id: string;
  title: string | null;
  body: string | null;
  mood: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CapsuleDelivery {
  id: string;
  entry_id: string;
  deliver_at: string;
  interval_kind: string;
  delivered_at: string | null;
  read_at: string | null;
  entry?: JournalEntry;
}

export const cloudStore = {
  // ----- mood -----
  async getTodayMood(userId: string): Promise<MoodKey | null> {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("mood_entries").select("mood")
      .eq("user_id", userId).eq("entry_date", today).maybeSingle();
    return (data?.mood as MoodKey) ?? null;
  },
  async setTodayMood(userId: string, mood: MoodKey) {
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("mood_entries")
      .upsert({ user_id: userId, entry_date: today, mood }, { onConflict: "user_id,entry_date" });
  },
  async getMoodHistory(userId: string): Promise<MoodEntry[]> {
    const { data } = await supabase.from("mood_entries")
      .select("entry_date, mood").eq("user_id", userId)
      .order("entry_date", { ascending: true });
    return (data ?? []).map((d) => ({ date: d.entry_date, mood: d.mood as MoodKey }));
  },

  // ----- journal PIN (6 digits, hashed in DB) -----
  async hasPin(userId: string): Promise<boolean> {
    const { data } = await supabase.from("journal_passcodes")
      .select("user_id").eq("user_id", userId).maybeSingle();
    return !!data;
  },
  async setPin(pin: string): Promise<{ error?: string }> {
    if (!/^[0-9]{6}$/.test(pin)) return { error: "PIN phải gồm đúng 6 chữ số." };
    const { error } = await supabase.rpc("set_journal_pin", { _pin: pin });
    if (error) return { error: error.message };
    return {};
  },
  async verifyPin(pin: string): Promise<boolean> {
    if (!/^[0-9]{6}$/.test(pin)) return false;
    const { data, error } = await supabase.rpc("verify_journal_pin", { _pin: pin });
    if (error) return false;
    return data === true;
  },

  // ----- journal entries -----
  async listEntries(userId: string): Promise<JournalEntry[]> {
    const { data } = await supabase.from("journal_entries")
      .select("id,title,body,mood,cover_image_url,created_at,updated_at")
      .eq("user_id", userId).order("created_at", { ascending: false });
    return (data ?? []) as JournalEntry[];
  },
  async getEntry(userId: string, id: string): Promise<JournalEntry | null> {
    const { data } = await supabase.from("journal_entries")
      .select("id,title,body,mood,cover_image_url,created_at,updated_at")
      .eq("user_id", userId).eq("id", id).maybeSingle();
    return (data as JournalEntry) ?? null;
  },
  async saveEntry(
    userId: string,
    payload: { id?: string; title: string; body: string; mood?: string | null; cover_image_url?: string | null },
  ): Promise<string | null> {
    if (payload.id) {
      await supabase.from("journal_entries").update({
        title: payload.title, body: payload.body,
        mood: payload.mood ?? null, cover_image_url: payload.cover_image_url ?? null,
      }).eq("id", payload.id).eq("user_id", userId);
      return payload.id;
    }
    const { data } = await supabase.from("journal_entries").insert({
      user_id: userId, title: payload.title, body: payload.body,
      mood: payload.mood ?? null, cover_image_url: payload.cover_image_url ?? null,
    }).select("id").single();
    return data?.id ?? null;
  },

  // ----- time capsule -----
  async createCapsule(userId: string, entryId: string, deliverAt: string, intervalKind: "once" | "daily" | "monthly") {
    await supabase.from("time_capsule_deliveries").insert({
      user_id: userId, entry_id: entryId, deliver_at: deliverAt, interval_kind: intervalKind,
    });
  },
  async getDueCapsules(userId: string): Promise<CapsuleDelivery[]> {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from("time_capsule_deliveries")
      .select("id,entry_id,deliver_at,interval_kind,delivered_at,read_at, entry:journal_entries(id,title,body,mood,cover_image_url,created_at,updated_at)")
      .eq("user_id", userId).is("read_at", null).lte("deliver_at", today)
      .order("deliver_at", { ascending: true });
    return (data ?? []) as unknown as CapsuleDelivery[];
  },
  async markCapsuleRead(userId: string, id: string) {
    await supabase.from("time_capsule_deliveries").update({
      read_at: new Date().toISOString(), delivered_at: new Date().toISOString(),
    }).eq("id", id).eq("user_id", userId);
  },

  // ----- podcast progress -----
  async getPodcastProgress(userId: string) {
    const { data } = await supabase.from("podcast_progress").select("*").eq("user_id", userId);
    return data ?? [];
  },
  async setEpisodeStatus(userId: string, episode_id: number, patch: Partial<{ completed: boolean; favorited: boolean; progress_seconds: number }>) {
    await supabase.from("podcast_progress")
      .upsert({ user_id: userId, episode_id, ...patch }, { onConflict: "user_id,episode_id" });
  },
};
