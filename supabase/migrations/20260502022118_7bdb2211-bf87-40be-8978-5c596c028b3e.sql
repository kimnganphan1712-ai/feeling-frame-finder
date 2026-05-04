-- Enable pgcrypto for secure hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Reset old passcode storage and switch to PIN hash + salt
ALTER TABLE public.journal_passcodes DROP COLUMN IF EXISTS passcode_hash;
ALTER TABLE public.journal_passcodes ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE public.journal_passcodes ADD COLUMN IF NOT EXISTS pin_salt TEXT;
DELETE FROM public.journal_passcodes;

-- Journal entries: mood + cover image
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS mood TEXT;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Time capsule deliveries
CREATE TABLE IF NOT EXISTS public.time_capsule_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  deliver_at DATE NOT NULL,
  interval_kind TEXT NOT NULL DEFAULT 'once',
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.time_capsule_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "capsule select own" ON public.time_capsule_deliveries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "capsule insert own" ON public.time_capsule_deliveries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "capsule update own" ON public.time_capsule_deliveries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "capsule delete own" ON public.time_capsule_deliveries
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_capsule_user_deliver ON public.time_capsule_deliveries(user_id, deliver_at);

-- Helper: set / change PIN (uses authenticated user's id)
CREATE OR REPLACE FUNCTION public.set_journal_pin(_pin TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _uid UUID := auth.uid();
  _salt TEXT;
  _hash TEXT;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;
  _salt := encode(gen_random_bytes(16), 'hex');
  _hash := encode(digest(_salt || _pin, 'sha256'), 'hex');

  INSERT INTO public.journal_passcodes(user_id, pin_hash, pin_salt, updated_at)
  VALUES (_uid, _hash, _salt, now())
  ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = EXCLUDED.pin_hash,
        pin_salt = EXCLUDED.pin_salt,
        updated_at = now();
END;
$$;

-- Helper: verify PIN
CREATE OR REPLACE FUNCTION public.verify_journal_pin(_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _uid UUID := auth.uid();
  _row public.journal_passcodes%ROWTYPE;
  _calc TEXT;
BEGIN
  IF _uid IS NULL THEN
    RETURN FALSE;
  END IF;
  SELECT * INTO _row FROM public.journal_passcodes WHERE user_id = _uid;
  IF NOT FOUND OR _row.pin_salt IS NULL OR _row.pin_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  _calc := encode(digest(_row.pin_salt || _pin, 'sha256'), 'hex');
  RETURN _calc = _row.pin_hash;
END;
$$;

-- Ensure unique passcode row per user
CREATE UNIQUE INDEX IF NOT EXISTS journal_passcodes_user_unique ON public.journal_passcodes(user_id);