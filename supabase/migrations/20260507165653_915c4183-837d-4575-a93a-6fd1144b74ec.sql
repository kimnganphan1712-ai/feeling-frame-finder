
-- Add private note to mood_checkins
ALTER TABLE public.mood_checkins
  ADD COLUMN IF NOT EXISTS note_private TEXT;

-- Breathing / meditation sessions
CREATE TABLE IF NOT EXISTS public.breathing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  planned_seconds INTEGER NOT NULL DEFAULT 60,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.breathing_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own breathing sessions"
ON public.breathing_sessions FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "insert own breathing sessions"
ON public.breathing_sessions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "update own breathing sessions"
ON public.breathing_sessions FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "delete own breathing sessions"
ON public.breathing_sessions FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_breathing_sessions_user_date
  ON public.breathing_sessions(user_id, entry_date DESC);

-- Achievement badges (one row per badge unlocked)
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_type)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own achievements"
ON public.achievements FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "insert own achievements"
ON public.achievements FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete own achievements"
ON public.achievements FOR DELETE TO authenticated
USING (user_id = auth.uid());
