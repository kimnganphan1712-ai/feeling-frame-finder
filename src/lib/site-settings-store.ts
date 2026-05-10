import { supabase } from "@/integrations/supabase/client";

export const siteSettingsStore = {
  async get(key: string): Promise<string | null> {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    return (data?.value as string) ?? null;
  },
  async getMany(keys: string[]): Promise<Record<string, string | null>> {
    const { data } = await supabase
      .from("site_settings")
      .select("key,value")
      .in("key", keys);
    const result: Record<string, string | null> = {};
    for (const k of keys) result[k] = null;
    for (const row of data ?? []) result[row.key as string] = (row.value as string) ?? null;
    return result;
  },
  async set(key: string, value: string, userId?: string): Promise<{ error?: string }> {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return { error: error.message };
    return {};
  },
};

export const SITE_KEYS = {
  discordInvite: "discord_invite_url",
  heroImage: "home_hero_image_url",
} as const;
