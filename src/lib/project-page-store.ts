import { supabase } from "@/integrations/supabase/client";

export type ProjectSection = {
  id: string;
  slug: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_main: string | null;
  image_secondary: string | null;
  image_gallery: string[];
  button_text: string | null;
  button_link: string | null;
  extra: Record<string, unknown>;
  is_visible: boolean;
  sort_order: number;
};

export type ProjectItem = {
  id: string;
  section_slug: string;
  kind: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  link: string | null;
  color: string | null;
  extra: Record<string, unknown>;
  is_visible: boolean;
  sort_order: number;
};

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  partnership_type: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

const SECTIONS_TABLE = "project_page_sections" as const;
const ITEMS_TABLE = "project_page_items" as const;
const CONTACTS_TABLE = "project_contact_submissions" as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export const projectPageStore = {
  async fetchAll(): Promise<{ sections: ProjectSection[]; items: ProjectItem[] }> {
    const [s, i] = await Promise.all([
      sb.from(SECTIONS_TABLE).select("*").order("sort_order", { ascending: true }),
      sb.from(ITEMS_TABLE).select("*").order("sort_order", { ascending: true }),
    ]);
    if (s.error) throw s.error;
    if (i.error) throw i.error;
    return { sections: s.data as ProjectSection[], items: i.data as ProjectItem[] };
  },

  async updateSection(id: string, patch: Partial<ProjectSection>) {
    const { error } = await sb.from(SECTIONS_TABLE).update(patch).eq("id", id);
    if (error) throw error;
  },

  async createItem(item: Partial<ProjectItem> & { section_slug: string; kind: string }) {
    const { data, error } = await sb.from(ITEMS_TABLE).insert(item).select("*").single();
    if (error) throw error;
    return data as ProjectItem;
  },

  async updateItem(id: string, patch: Partial<ProjectItem>) {
    const { error } = await sb.from(ITEMS_TABLE).update(patch).eq("id", id);
    if (error) throw error;
  },

  async deleteItem(id: string) {
    const { error } = await sb.from(ITEMS_TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  async submitContact(payload: {
    name: string;
    email: string;
    organization?: string;
    partnership_type?: string;
    message: string;
  }) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await sb.from(CONTACTS_TABLE).insert({
      ...payload,
      user_id: u.user?.id ?? null,
    });
    if (error) throw error;
  },

  async listContacts(): Promise<ContactSubmission[]> {
    const { data, error } = await sb
      .from(CONTACTS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as ContactSubmission[];
  },

  async markContactRead(id: string, is_read: boolean) {
    const { error } = await sb.from(CONTACTS_TABLE).update({ is_read }).eq("id", id);
    if (error) throw error;
  },

  async deleteContact(id: string) {
    const { error } = await sb.from(CONTACTS_TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  async uploadImage(file: File, folder: string): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("project-page-media")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    return supabase.storage.from("project-page-media").getPublicUrl(path).data.publicUrl;
  },
};

export function bySlug(sections: ProjectSection[], slug: string): ProjectSection | undefined {
  return sections.find((s) => s.slug === slug);
}

export function itemsOf(items: ProjectItem[], section_slug: string, kind?: string): ProjectItem[] {
  return items
    .filter((i) => i.section_slug === section_slug && (!kind || i.kind === kind) && i.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order);
}
