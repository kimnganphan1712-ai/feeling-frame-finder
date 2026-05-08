import { supabase } from "@/integrations/supabase/client";
import { localDateKey } from "@/lib/utils";

export interface BreathingSession {
  id: string;
  user_id: string;
  entry_date: string;
  duration_seconds: number;
  planned_seconds: number;
  completed: boolean;
  created_at: string;
}

export interface BreathingStats {
  currentStreak: number;
  longestStreak: number;
  totalSeconds: number;
  totalSecondsThisMonth: number;
  totalSessions: number;
  lastDate: string | null;
  byDate: Record<string, number>; // date -> total seconds
}

export interface AchievementBadge {
  id: string;
  badge_type: string;
  unlocked_at: string;
}

export const BADGES: { type: string; label: string; emoji: string; desc: string }[] = [
  { type: "first_return", label: "Ngày đầu tiên quay về", emoji: "🌱", desc: "Hoàn thành phiên hít thở đầu tiên" },
  { type: "streak_3", label: "3 ngày dịu lại", emoji: "🌿", desc: "3 ngày liên tiếp" },
  { type: "streak_7", label: "7 ngày thở cùng mình", emoji: "🌸", desc: "7 ngày liên tiếp" },
  { type: "minutes_30", label: "30 phút bình yên", emoji: "🕯️", desc: "Tổng 30 phút hít thở" },
  { type: "month_care", label: "Một tháng chăm sóc bản thân", emoji: "✨", desc: "Đều đặn nhiều ngày trong tháng" },
];

function diffDays(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
}

export const breathingStore = {
  async list(userId: string): Promise<BreathingSession[]> {
    const { data } = await supabase
      .from("breathing_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false });
    return (data ?? []) as BreathingSession[];
  },

  async logSession(payload: {
    user_id: string;
    duration_seconds: number;
    planned_seconds: number;
    completed: boolean;
  }): Promise<BreathingSession | null> {
    const today = localDateKey();
    const { data } = await supabase
      .from("breathing_sessions")
      .insert({
        user_id: payload.user_id,
        entry_date: today,
        duration_seconds: payload.duration_seconds,
        planned_seconds: payload.planned_seconds,
        completed: payload.completed,
      })
      .select("*")
      .single();
    return (data as BreathingSession) ?? null;
  },

  computeStats(sessions: BreathingSession[]): BreathingStats {
    const completed = sessions.filter((s) => s.completed);
    const byDate: Record<string, number> = {};
    completed.forEach((s) => {
      byDate[s.entry_date] = (byDate[s.entry_date] ?? 0) + s.duration_seconds;
    });
    const dates = Object.keys(byDate).sort(); // ascending
    let longest = 0;
    let run = 0;
    let prev: string | null = null;
    for (const d of dates) {
      if (prev && diffDays(prev, d) === 1) run += 1;
      else run = 1;
      if (run > longest) longest = run;
      prev = d;
    }
    // current streak ending today or yesterday
    let current = 0;
    const today = localDateKey();
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();
    let cursor = byDate[today] ? today : (byDate[yesterday] ? yesterday : null);
    while (cursor && byDate[cursor]) {
      current += 1;
      const d = new Date(cursor + "T00:00:00");
      d.setDate(d.getDate() - 1);
      cursor = d.toISOString().slice(0, 10);
    }
    const monthPrefix = today.slice(0, 7);
    const totalSecondsThisMonth = Object.entries(byDate)
      .filter(([d]) => d.startsWith(monthPrefix))
      .reduce((acc, [, v]) => acc + v, 0);
    const totalSeconds = Object.values(byDate).reduce((a, b) => a + b, 0);

    return {
      currentStreak: current,
      longestStreak: longest,
      totalSeconds,
      totalSecondsThisMonth,
      totalSessions: completed.length,
      lastDate: dates.length ? dates[dates.length - 1] : null,
      byDate,
    };
  },

  async listAchievements(userId: string): Promise<AchievementBadge[]> {
    const { data } = await supabase
      .from("achievements")
      .select("id,badge_type,unlocked_at")
      .eq("user_id", userId);
    return (data ?? []) as AchievementBadge[];
  },

  async unlock(userId: string, type: string): Promise<void> {
    await supabase
      .from("achievements")
      .insert({ user_id: userId, badge_type: type })
      .select()
      .maybeSingle();
  },

  /** Evaluate which badges should be unlocked given stats and unlock missing ones. */
  async evaluateAndUnlock(userId: string, stats: BreathingStats, alreadyUnlocked: string[]): Promise<string[]> {
    const newly: string[] = [];
    const has = (t: string) => alreadyUnlocked.includes(t);
    const tryUnlock = async (t: string) => {
      if (!has(t)) {
        await this.unlock(userId, t);
        newly.push(t);
      }
    };
    if (stats.totalSessions >= 1) await tryUnlock("first_return");
    if (stats.currentStreak >= 3 || stats.longestStreak >= 3) await tryUnlock("streak_3");
    if (stats.currentStreak >= 7 || stats.longestStreak >= 7) await tryUnlock("streak_7");
    if (stats.totalSeconds >= 30 * 60) await tryUnlock("minutes_30");
    const monthDays = Object.keys(stats.byDate).filter((d) =>
      d.startsWith(new Date().toISOString().slice(0, 7))
    ).length;
    if (monthDays >= 15) await tryUnlock("month_care");
    return newly;
  },
};
