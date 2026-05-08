// Lightweight in-memory + localStorage store for the v1 demo.
import { MoodKey } from "./mood";

const KEY_MOOD = "tramdiu:mood";
const KEY_DONE_WELCOME = "tramdiu:welcome";
const KEY_HISTORY = "tramdiu:history";

export interface MoodEntry {
  date: string; // YYYY-MM-DD
  mood: MoodKey;
}

export const store = {
  isWelcomeDone(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY_DONE_WELCOME) === "1";
  },
  setWelcomeDone() {
    localStorage.setItem(KEY_DONE_WELCOME, "1");
  },
  setTodayMood(mood: MoodKey) {
    localStorage.setItem(KEY_MOOD, mood);
    const today = localDateKey();
    const history = this.getHistory().filter((h) => h.date !== today);
    history.push({ date: today, mood });
    localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
  },
  getTodayMood(): MoodKey | null {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem(KEY_MOOD) as MoodKey) || null;
  },
  getHistory(): MoodEntry[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(KEY_HISTORY) || "[]");
    } catch {
      return [];
    }
  },
  reset() {
    localStorage.removeItem(KEY_MOOD);
    localStorage.removeItem(KEY_DONE_WELCOME);
  },
};
