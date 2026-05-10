import { supabase } from "@/integrations/supabase/client";

export type SiteImage = {
  id: string;
  slot: string;
  url: string;
  alt: string | null;
  caption: string | null;
  tag: string | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;
const TABLE = "site_images";

/** Slots used by the app — keep in sync with admin UI. */
export const IMAGE_SLOTS = {
  homeHero: "home_hero",
  homeFeature: "home_feature",
  aboutHero: "about_hero",
  aboutGallery: "about_gallery",
  aboutTeam: "about_team",
  aboutStory: "about_story",
  prescriptionBanner: "prescription_banner",
  podcastBanner: "podcast_banner",
  vitaminBanner: "vitamin_banner",
  moodBoardBanner: "mood_board_banner",
  journalBanner: "journal_banner",
} as const;

export type ImageSlot = (typeof IMAGE_SLOTS)[keyof typeof IMAGE_SLOTS];

export const SLOT_LABELS: Record<string, { label: string; description: string }> = {
  home_hero: { label: "Home — Hero (1 ảnh)", description: "Ảnh nền cinematic ở hero trang chủ. Lấy ảnh đầu (sort 0)." },
  home_feature: { label: "Home — Banner phụ", description: "Ảnh trang trí thêm ở trang chủ." },
  about_hero: { label: "Phác đồ — Hero", description: "Ảnh hero lớn cho trang Phác đồ chữa lành." },
  about_gallery: { label: "Phác đồ — Gallery", description: "Lưới ảnh khoảnh khắc / gallery dự án." },
  about_team: { label: "Phác đồ — Founder/Team", description: "Ảnh founder hoặc thành viên." },
  about_story: { label: "Phác đồ — Câu chuyện", description: "Ảnh xen kẽ trong section storytelling." },
  prescription_banner: { label: "Đơn thuốc — Banner", description: "Ảnh nền đầu trang Đơn thuốc tinh thần." },
  podcast_banner: { label: "Tần số — Banner", description: "Ảnh nền đầu trang Tần số chữa lành." },
  vitamin_banner: { label: "Vitamin — Banner", description: "Ảnh nền đầu trang Vitamin cho tâm hồn." },
  mood_board_banner: { label: "Trạm kết nối — Banner", description: "Ảnh nền đầu trang Trạm kết nối." },
  journal_banner: { label: "Hồ sơ — Banner", description: "Ảnh nền đầu trang Hồ sơ cảm xúc." },
};

export const siteImagesStore = {
  async listBySlot(slot: string): Promise<SiteImage[]> {
    const { data, error } = await sb
      .from(TABLE)
      .select("*")
      .eq("slot", slot)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[site_images]", error);
      return [];
    }
    return (data ?? []) as SiteImage[];
  },

  async listAll(): Promise<SiteImage[]> {
    const { data, error } = await sb
      .from(TABLE)
      .select("*")
      .order("slot", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) {
      console.warn("[site_images]", error);
      return [];
    }
    return (data ?? []) as SiteImage[];
  },

  async firstUrl(slot: string, fallback?: string): Promise<string | undefined> {
    const list = await this.listBySlot(slot);
    return list[0]?.url ?? fallback;
  },

  async create(payload: Partial<SiteImage> & { slot: string; url: string }) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await sb.from(TABLE).insert({
      ...payload,
      created_by: u.user?.id ?? null,
    });
    if (error) throw error;
  },

  async update(id: string, patch: Partial<SiteImage>) {
    const { error } = await sb.from(TABLE).update(patch).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string) {
    const { error } = await sb.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  async reorder(items: { id: string; sort_order: number }[]) {
    await Promise.all(items.map((it) => this.update(it.id, { sort_order: it.sort_order })));
  },

  /** Upload to existing project-page-media bucket and return the public URL. */
  async uploadFile(file: File, slot: string): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `site/${slot}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("project-page-media")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    return supabase.storage.from("project-page-media").getPublicUrl(path).data.publicUrl;
  },
};
