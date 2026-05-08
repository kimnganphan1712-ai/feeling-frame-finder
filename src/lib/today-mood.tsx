import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { moodCheckinStore, MoodCheckin } from "@/lib/mood-checkin-store";
import { cloudStore } from "@/lib/cloud-store";
import { MOODS, MoodKey, getMoodMessage } from "@/lib/mood";
import { STICKERS, StickerOption, getSticker } from "@/lib/stickers";
import type { MascotVariant } from "@/components/Mascot";

/**
 * Map sticker type → MoodKey (legacy 4-mood enum used by calendar / charts).
 * The pop-up sticker is the source of truth — everything else derives from it.
 */
export function stickerToMoodKey(stickerType: string | null | undefined): MoodKey | null {
  switch (stickerType) {
    case "happy_yellow":
    case "grateful_pink":
    case "hopeful_teal":
      return "joy";
    case "calm_green":
      return "calm";
    case "angry_coral":
    case "stress_peach":
    case "stress_red":
      return "anger";
    case "sad_purple":
    case "tired_blue":
    case "worry_purple":
    case "empty_gray":
      return "sad";
    default:
      return null;
  }
}

export function stickerToMascot(stickerType: string | null | undefined): MascotVariant {
  switch (stickerType) {
    case "happy_yellow":
    case "grateful_pink":
    case "hopeful_teal":
      return "happy";
    case "calm_green":
      return "default";
    case "angry_coral":
    case "stress_peach":
    case "stress_red":
      return "encourage";
    case "sad_purple":
    case "tired_blue":
    case "worry_purple":
    case "empty_gray":
      return "comfort";
    default:
      return "default";
  }
}

const NEUTRAL_MESSAGE = "Hôm nay bạn thấy thế nào?";

interface TodayMoodCtxValue {
  loading: boolean;
  checkin: MoodCheckin | null;
  /** legacy 4-mood key derived from sticker (for calendar/distribution). */
  moodKey: MoodKey | null;
  /** Mood meta object (label/emoji/color). Falls back to "calm" for visuals when null. */
  mood: typeof MOODS[number] | null;
  /** Sticker option corresponding to today's check-in. */
  sticker: StickerOption | null;
  /** Adjective the user typed in the pop-up (e.g. "biết ơn"). */
  adjective: string | null;
  /** Short message that goes with the mood. */
  message: string;
  /** Mascot variant matching the mood. */
  mascot: MascotVariant;
  /** Update the central state instantly after a new check-in. */
  setCheckin: (c: MoodCheckin | null) => void;
  /** Force re-fetch from server. */
  refresh: () => Promise<void>;
}

const Ctx = createContext<TodayMoodCtxValue | undefined>(undefined);

export function TodayMoodProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [checkin, setCheckinState] = useState<MoodCheckin | null>(null);
  const [loading, setLoading] = useState(true);
  // Stable random message per checkin id (avoid re-shuffling on every render).
  const [messageSeed, setMessageSeed] = useState<{ id: string; text: string } | null>(null);

  const fetchToday = useCallback(async () => {
    if (!user) {
      setCheckinState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const row = await moodCheckinStore.getToday(user.id);
    setCheckinState(row);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const setCheckin = useCallback((c: MoodCheckin | null) => {
    setCheckinState(c);
    // Also mirror to the legacy mood_entries table so calendar/history stay in sync.
    if (c && user) {
      const mk = stickerToMoodKey(c.sticker_type);
      if (mk) {
        cloudStore.setTodayMood(user.id, mk).catch(() => {});
      }
    }
  }, [user]);

  const value = useMemo<TodayMoodCtxValue>(() => {
    const sticker = checkin ? (getSticker(checkin.sticker_type) ?? {
      type: checkin.sticker_type,
      label: checkin.adjective,
      color: checkin.sticker_color,
      face: "calm" as const,
    }) : null;
    const moodKey = stickerToMoodKey(checkin?.sticker_type);
    const mood = moodKey ? (MOODS.find((m) => m.key === moodKey) ?? null) : null;

    let message = NEUTRAL_MESSAGE;
    if (checkin && moodKey) {
      if (messageSeed?.id === checkin.id) {
        message = messageSeed.text;
      } else {
        const text = getMoodMessage(moodKey);
        message = text;
        // Defer setState to avoid render warnings.
        queueMicrotask(() => setMessageSeed({ id: checkin.id, text }));
      }
    }

    return {
      loading,
      checkin,
      moodKey,
      mood,
      sticker,
      adjective: checkin?.adjective ?? null,
      message,
      mascot: stickerToMascot(checkin?.sticker_type),
      setCheckin,
      refresh: fetchToday,
    };
  }, [checkin, loading, messageSeed, setCheckin, fetchToday]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTodayMood(): TodayMoodCtxValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTodayMood must be used inside <TodayMoodProvider>");
  return v;
}

/** Helpers re-exported for convenience. */
export { STICKERS };
