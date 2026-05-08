-- Ensure each user has exactly one mood check-in per day
ALTER TABLE public.mood_checkins
  ADD CONSTRAINT mood_checkins_user_date_unique UNIQUE (user_id, entry_date);