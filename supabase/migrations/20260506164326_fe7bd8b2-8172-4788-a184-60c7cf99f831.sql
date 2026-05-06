-- Public mood check-ins (1 per user per day) for the global mood board
CREATE TABLE public.mood_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  adjective TEXT NOT NULL,
  sticker_type TEXT NOT NULL,
  sticker_color TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

-- Validate adjective: 1-20 chars, no newlines, after trim
CREATE OR REPLACE FUNCTION public.validate_mood_checkin()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.adjective := btrim(NEW.adjective);
  IF char_length(NEW.adjective) < 1 OR char_length(NEW.adjective) > 20 THEN
    RAISE EXCEPTION 'Adjective must be 1-20 characters';
  END IF;
  IF NEW.adjective ~ E'[\\n\\r]' THEN
    RAISE EXCEPTION 'Adjective must not contain newlines';
  END IF;
  IF NEW.sticker_type !~ '^[a-z_]{1,32}$' THEN
    RAISE EXCEPTION 'Invalid sticker_type';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER mood_checkin_validate
BEFORE INSERT OR UPDATE ON public.mood_checkins
FOR EACH ROW EXECUTE FUNCTION public.validate_mood_checkin();

CREATE INDEX idx_mood_checkins_date ON public.mood_checkins (entry_date DESC, created_at DESC);
CREATE INDEX idx_mood_checkins_user ON public.mood_checkins (user_id, entry_date DESC);

ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view public check-ins; user can always see own; admin sees all
CREATE POLICY "view public or own mood checkins"
ON public.mood_checkins FOR SELECT
TO authenticated
USING (is_public = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "insert own mood checkin"
ON public.mood_checkins FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "update own mood checkin"
ON public.mood_checkins FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Owner can delete own; admin can delete any
CREATE POLICY "delete own or admin mood checkin"
ON public.mood_checkins FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
