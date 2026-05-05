import { supabase } from "@/integrations/supabase/client";

export type QuoteStatus = "pending" | "approved" | "rejected";
export type WorkType = "film" | "book" | "podcast" | "playlist" | "article" | "other";
export type AlbumVisibility = "public" | "private";

export interface Quote {
  id: string;
  content: string;
  source_text: string | null;
  author_name: string | null;
  work_title: string | null;
  note: string | null;
  submitted_by: string;
  display_name: string | null;
  status: QuoteStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealingWork {
  id: string;
  title: string;
  description: string | null;
  type: WorkType;
  thumbnail_url: string | null;
  external_link: string | null;
  tags: string[];
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: AlbumVisibility;
  created_at: string;
  updated_at: string;
}

export const vitaminStore = {
  // ---- quotes (public) ----
  async listApproved(): Promise<Quote[]> {
    const { data } = await supabase
      .from("quotes")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    return (data ?? []) as Quote[];
  },

  async submitQuote(p: {
    content: string;
    source_text?: string;
    author_name?: string;
    work_title?: string;
    note?: string;
    display_name?: string;
  }): Promise<{ error?: string }> {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { error: "Bạn cần đăng nhập" };
    if (!p.content.trim()) return { error: "Vui lòng viết nội dung câu nói" };
    if (!p.source_text?.trim() && !p.author_name?.trim() && !p.work_title?.trim()) {
      return { error: "Vui lòng ghi rõ nguồn / tác giả / tác phẩm" };
    }
    const { error } = await supabase.from("quotes").insert({
      submitted_by: u.user.id,
      content: p.content.trim(),
      source_text: p.source_text?.trim() || null,
      author_name: p.author_name?.trim() || null,
      work_title: p.work_title?.trim() || null,
      note: p.note?.trim() || null,
      display_name: p.display_name?.trim() || null,
    });
    if (error) return { error: error.message };
    return {};
  },

  async myQuotes(): Promise<Quote[]> {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return [];
    const { data } = await supabase
      .from("quotes").select("*")
      .eq("submitted_by", u.user.id)
      .order("created_at", { ascending: false });
    return (data ?? []) as Quote[];
  },

  // ---- moderation (admin) ----
  async listByStatus(status: QuoteStatus): Promise<Quote[]> {
    const { data } = await supabase
      .from("quotes").select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });
    return (data ?? []) as Quote[];
  },
  async approveQuote(id: string, edits?: Partial<Quote>) {
    const { data: u } = await supabase.auth.getUser();
    const patch: {
      status: "approved";
      reviewed_by: string | null;
      reviewed_at: string;
      content?: string;
      source_text?: string | null;
      author_name?: string | null;
      work_title?: string | null;
    } = {
      status: "approved",
      reviewed_by: u.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    };
    if (edits?.content !== undefined) patch.content = edits.content;
    if (edits?.source_text !== undefined) patch.source_text = edits.source_text;
    if (edits?.author_name !== undefined) patch.author_name = edits.author_name;
    if (edits?.work_title !== undefined) patch.work_title = edits.work_title;
    await supabase.from("quotes").update(patch).eq("id", id);
  },
  async rejectQuote(id: string, reason?: string) {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("quotes").update({
      status: "rejected",
      reviewed_by: u.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
      reject_reason: reason ?? null,
    }).eq("id", id);
  },

  // ---- healing works ----
  async listWorks(includeUnpublished = false): Promise<HealingWork[]> {
    let q = supabase.from("healing_works").select("*").order("created_at", { ascending: false });
    if (!includeUnpublished) q = q.eq("is_published", true);
    const { data } = await q;
    return (data ?? []) as HealingWork[];
  },
  async upsertWork(w: Partial<HealingWork> & { id?: string }) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { error: "Cần đăng nhập" };
    if (w.id) {
      const { error } = await supabase.from("healing_works").update({
        title: w.title, description: w.description ?? null, type: w.type,
        thumbnail_url: w.thumbnail_url ?? null, external_link: w.external_link ?? null,
        tags: w.tags ?? [], is_published: w.is_published ?? true,
      }).eq("id", w.id);
      return { error: error?.message };
    }
    const { error } = await supabase.from("healing_works").insert({
      title: w.title!, description: w.description ?? null, type: w.type ?? "article",
      thumbnail_url: w.thumbnail_url ?? null, external_link: w.external_link ?? null,
      tags: w.tags ?? [], is_published: w.is_published ?? true, created_by: u.user.id,
    });
    return { error: error?.message };
  },
  async deleteWork(id: string) {
    await supabase.from("healing_works").delete().eq("id", id);
  },

  // ---- albums ----
  async myAlbums(): Promise<Album[]> {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return [];
    const { data } = await supabase
      .from("albums").select("*")
      .eq("user_id", u.user.id)
      .order("updated_at", { ascending: false });
    return (data ?? []) as Album[];
  },
  async createAlbum(p: { title: string; description?: string; visibility?: AlbumVisibility; cover_image_url?: string | null }) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { error: "Cần đăng nhập" };
    if (!p.title.trim()) return { error: "Đặt cho album một cái tên nhé" };
    const { data, error } = await supabase.from("albums").insert({
      user_id: u.user.id,
      title: p.title.trim(),
      description: p.description?.trim() || null,
      visibility: p.visibility ?? "private",
      cover_image_url: p.cover_image_url ?? null,
    }).select("id").single();
    return { error: error?.message, id: data?.id };
  },
  async updateAlbum(id: string, patch: Partial<Album>) {
    const allowed: {
      title?: string;
      description?: string | null;
      visibility?: AlbumVisibility;
      cover_image_url?: string | null;
    } = {};
    if (patch.title !== undefined) allowed.title = patch.title;
    if (patch.description !== undefined) allowed.description = patch.description;
    if (patch.visibility !== undefined) allowed.visibility = patch.visibility;
    if (patch.cover_image_url !== undefined) allowed.cover_image_url = patch.cover_image_url;
    await supabase.from("albums").update(allowed).eq("id", id);
  },
  async deleteAlbum(id: string) {
    await supabase.from("albums").delete().eq("id", id);
  },
  async listAlbumQuotes(albumId: string): Promise<Quote[]> {
    const { data } = await supabase
      .from("album_items")
      .select("quote:quotes(*)")
      .eq("album_id", albumId);
    return ((data ?? []).map((r) => (r as { quote: Quote }).quote).filter(Boolean)) as Quote[];
  },
  async addQuoteToAlbum(albumId: string, quoteId: string) {
    await supabase.from("album_items").upsert({ album_id: albumId, quote_id: quoteId }, { onConflict: "album_id,quote_id" });
  },
  async removeQuoteFromAlbum(albumId: string, quoteId: string) {
    await supabase.from("album_items").delete().eq("album_id", albumId).eq("quote_id", quoteId);
  },

  // ---- favorites ----
  async listFavoriteIds(): Promise<string[]> {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return [];
    const { data } = await supabase.from("quote_favorites").select("quote_id").eq("user_id", u.user.id);
    return (data ?? []).map((r) => r.quote_id);
  },
  async toggleFavorite(quoteId: string, on: boolean) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (on) {
      await supabase.from("quote_favorites").insert({ user_id: u.user.id, quote_id: quoteId });
    } else {
      await supabase.from("quote_favorites").delete().eq("user_id", u.user.id).eq("quote_id", quoteId);
    }
  },

  // ---- storage ----
  async uploadImage(file: File, folder: "album" | "healing"): Promise<string | null> {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = folder === "healing"
      ? `healing/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      : `${u.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("vitamin-media").upload(path, file, { upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from("vitamin-media").getPublicUrl(path);
    return data.publicUrl;
  },
};
