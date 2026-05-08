import { supabase } from "@/integrations/supabase/client";

export type EmotionEventType = "open" | "cta_click" | "random_quote";

export interface LogParams {
  cornerKey: string;
  eventType: EmotionEventType;
  ctaLabel?: string;
  ctaTarget?: string;
  ctaIndex?: number;
}

export async function logEmotionCornerEvent(params: LogParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("emotion_corner_events").insert({
      user_id: user.id,
      corner_key: params.cornerKey,
      event_type: params.eventType,
      cta_label: params.ctaLabel ?? null,
      cta_target: params.ctaTarget ?? null,
      cta_index: params.ctaIndex ?? null,
    });
  } catch (err) {
    // analytics must never break UX
    console.warn("emotion-corner analytics failed", err);
  }
}

export interface EmotionEventRow {
  id: string;
  user_id: string;
  corner_key: string;
  event_type: EmotionEventType;
  cta_label: string | null;
  cta_target: string | null;
  cta_index: number | null;
  created_at: string;
}

export async function listEmotionCornerEvents(sinceDays = 30): Promise<EmotionEventRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const { data, error } = await supabase
    .from("emotion_corner_events")
    .select("*")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as EmotionEventRow[];
}
