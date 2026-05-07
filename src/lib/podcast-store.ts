import { supabase } from "@/integrations/supabase/client";

export type PodcastStatus = "draft" | "public" | "private" | "scheduled";

export interface Podcast {
  id: string;
  title: string;
  short_description: string;
  long_description: string | null;
  audio_url: string | null;
  cover_image_url: string | null;
  host: string | null;
  duration_seconds: number | null;
  published_at: string | null;
  category: string;
  emotion_tags: string[];
  mood_targets: string[];
  series: string | null;
  episode_number: number | null;
  status: PodcastStatus;
  healing_message: string | null;
  transcript: string | null;
  content_source: string | null;
  music_source: string | null;
  original_author: string | null;
  reference_link: string | null;
  self_produced: boolean;
  show_on_home: boolean;
  show_in_today: boolean;
  allow_favorite: boolean;
  allow_reactions: boolean;
  allow_comments: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const PODCAST_CATEGORIES = [
  { value: "general", label: "Chung" },
  { value: "meditation", label: "Thiền" },
  { value: "story", label: "Kể chuyện" },
  { value: "talk", label: "Trò chuyện" },
  { value: "music", label: "Nhạc chữa lành" },
  { value: "sleep", label: "Giấc ngủ" },
  { value: "breathing", label: "Hơi thở" },
];

export const MOOD_TARGETS = [
  { value: "joy", label: "Vui" },
  { value: "calm", label: "Bình thường" },
  { value: "sad", label: "Buồn" },
  { value: "anxious", label: "Lo âu" },
  { value: "anger", label: "Tức giận" },
  { value: "lonely", label: "Cô đơn" },
  { value: "insomnia", label: "Mất ngủ" },
  { value: "need_comfort", label: "Cần được an ủi" },
];

export const podcastStore = {
  async listAll(): Promise<Podcast[]> {
    const { data } = await supabase
      .from("podcasts")
      .select("*")
      .order("created_at", { ascending: false });
    return (data ?? []) as Podcast[];
  },

  async listVisible(): Promise<Podcast[]> {
    const { data } = await supabase
      .from("podcasts")
      .select("*")
      .eq("status", "public")
      .order("published_at", { ascending: false });
    return (data ?? []) as Podcast[];
  },

  async upsert(p: Partial<Podcast> & { id?: string }): Promise<{ error?: string; id?: string }> {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { error: "Cần đăng nhập" };
    if (p.id) {
      const { error } = await supabase.from("podcasts").update({
        title: p.title, short_description: p.short_description, long_description: p.long_description ?? null,
        audio_url: p.audio_url ?? null, cover_image_url: p.cover_image_url ?? null,
        host: p.host ?? null, duration_seconds: p.duration_seconds ?? null,
        published_at: p.published_at ?? null, category: p.category ?? "general",
        emotion_tags: p.emotion_tags ?? [], mood_targets: p.mood_targets ?? [],
        series: p.series ?? null, episode_number: p.episode_number ?? null,
        status: p.status ?? "draft", healing_message: p.healing_message ?? null,
        transcript: p.transcript ?? null, content_source: p.content_source ?? null,
        music_source: p.music_source ?? null, original_author: p.original_author ?? null,
        reference_link: p.reference_link ?? null, self_produced: p.self_produced ?? false,
        show_on_home: p.show_on_home ?? false, show_in_today: p.show_in_today ?? true,
        allow_favorite: p.allow_favorite ?? true, allow_reactions: p.allow_reactions ?? true,
        allow_comments: p.allow_comments ?? false,
      }).eq("id", p.id);
      return { error: error?.message, id: p.id };
    }
    const { data, error } = await supabase.from("podcasts").insert({
      title: p.title!, short_description: p.short_description!, long_description: p.long_description ?? null,
      audio_url: p.audio_url ?? null, cover_image_url: p.cover_image_url ?? null,
      host: p.host ?? null, duration_seconds: p.duration_seconds ?? null,
      published_at: p.published_at ?? null, category: p.category ?? "general",
      emotion_tags: p.emotion_tags ?? [], mood_targets: p.mood_targets ?? [],
      series: p.series ?? null, episode_number: p.episode_number ?? null,
      status: p.status ?? "draft", healing_message: p.healing_message ?? null,
      transcript: p.transcript ?? null, content_source: p.content_source ?? null,
      music_source: p.music_source ?? null, original_author: p.original_author ?? null,
      reference_link: p.reference_link ?? null, self_produced: p.self_produced ?? false,
      show_on_home: p.show_on_home ?? false, show_in_today: p.show_in_today ?? true,
      allow_favorite: p.allow_favorite ?? true, allow_reactions: p.allow_reactions ?? true,
      allow_comments: p.allow_comments ?? false, created_by: u.user.id,
    }).select("id").single();
    return { error: error?.message, id: data?.id };
  },

  async remove(id: string) {
    await supabase.from("podcasts").delete().eq("id", id);
  },

  async setStatus(id: string, status: PodcastStatus) {
    await supabase.from("podcasts").update({ status }).eq("id", id);
  },

  async uploadFile(file: File, folder: "audio" | "cover"): Promise<string | null> {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("podcast-media").upload(path, file, { upsert: false });
    if (error) return null;
    return supabase.storage.from("podcast-media").getPublicUrl(path).data.publicUrl;
  },
};
